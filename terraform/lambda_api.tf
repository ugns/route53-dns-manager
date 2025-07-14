resource "aws_iam_role" "lambda_dns_manager" {
  name = "lambda_dns_manager_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_dns_manager_policy" {
  name = "lambda_dns_manager_policy"
  role = aws_iam_role.lambda_dns_manager.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ListResourceRecordSets",
          "route53:ChangeResourceRecordSets"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "dns_manager" {
  function_name    = "dnsManager"
  role             = aws_iam_role.lambda_dns_manager.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = data.archive_file.dns_manager_zip.output_path
  source_code_hash = data.archive_file.dns_manager_zip.output_base64sha256
  environment {
    variables = {
      GOOGLE_CLIENT_ID = var.google_client_id
      HOSTED_ZONE_ID   = aws_route53_zone.this.zone_id
      DNS_DOMAIN       = var.domain_name
    }
  }
}

resource "aws_api_gateway_rest_api" "dns_manager_api" {
  name        = "dnsManagerApi"
  description = "API Gateway for DNS Manager Lambda"
}

resource "aws_api_gateway_resource" "dns_manager_resource" {
  rest_api_id = aws_api_gateway_rest_api.dns_manager_api.id
  parent_id   = aws_api_gateway_rest_api.dns_manager_api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "dns_manager_dns_resource" {
  rest_api_id = aws_api_gateway_rest_api.dns_manager_api.id
  parent_id   = aws_api_gateway_resource.dns_manager_resource.id
  path_part   = "dns"
}

resource "aws_api_gateway_method" "dns_manager_method" {
  rest_api_id   = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id   = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dns_manager_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id             = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method             = aws_api_gateway_method.dns_manager_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.dns_manager.invoke_arn
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dns_manager.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dns_manager_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "dns_manager_deployment" {
  depends_on  = [aws_api_gateway_integration.dns_manager_integration]
  rest_api_id = aws_api_gateway_rest_api.dns_manager_api.id
  triggers = {
    lambda_hash = data.archive_file.dns_manager_zip.output_base64sha256
  }
}

resource "aws_api_gateway_method" "dns_manager_options" {
  rest_api_id   = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id   = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dns_manager_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id             = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method             = aws_api_gateway_method.dns_manager_options.http_method
  type                    = "MOCK"
  request_templates       = { "application/json" = "{\"statusCode\": 200}" }
  integration_http_method = "OPTIONS"
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "dns_manager_options_response" {
  rest_api_id     = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id     = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method     = aws_api_gateway_method.dns_manager_options.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true,
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "dns_manager_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.dns_manager_api.id
  resource_id = aws_api_gateway_resource.dns_manager_dns_resource.id
  http_method = aws_api_gateway_method.dns_manager_options.http_method
  status_code = aws_api_gateway_method_response.dns_manager_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,DELETE'"
  }
  response_templates = { "application/json" = "" }
}

output "dns_manager_api_url" {
  value = "https://${aws_api_gateway_rest_api.dns_manager_api.id}.execute-api.${data.aws_region.current.region}.amazonaws.com/prod/api/dns"
}

