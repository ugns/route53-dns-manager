resource "null_resource" "dns_manager_npm_install" {
  provisioner "local-exec" {
    command = "cd ${path.module}/../amplify/backend/function/dnsManager && npm install"
  }
}

data "archive_file" "dns_manager_zip" {
  depends_on  = [null_resource.dns_manager_npm_install]
  type        = "zip"
  source_dir  = "${path.module}/../amplify/backend/function/dnsManager"
  output_path = "${path.module}/../amplify/backend/function/dnsManager.zip"
}
