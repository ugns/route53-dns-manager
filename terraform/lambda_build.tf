data "archive_file" "dns_manager_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../amplify/backend/function/dnsManager"
  output_path = "${path.module}/../amplify/backend/function/dnsManager.zip"
}
