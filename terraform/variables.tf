variable "gh_action_role" {
  description = "AWS IAM ARN for Terraform GitHub Actions"
  type        = string
}

variable "repository" {
  description = "Source repository"
  type        = string
}

variable "domain_name" {
  description = "The domain name to host site"
  type        = string
}

variable "comment" {
  description = "AWS Route53 Hosted Zone comment"
  type        = string
}

variable "gh_access_token" {
  description = "GitHub access token for CI/CD or API access"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google Client ID for OAuth"
  type        = string
}