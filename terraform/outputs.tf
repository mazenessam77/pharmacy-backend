# ============================================================
# outputs.tf — Values printed after `terraform apply`
# ============================================================

output "elastic_ip" {
  description = "Elastic IP — add this as an A record in Cloudflare DNS"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.app.public_ip}"
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "app_url_http" {
  description = "Direct HTTP URL (before DNS is set up)"
  value       = "http://${aws_eip.app.public_ip}"
}

output "ami_used" {
  description = "Ubuntu AMI ID selected by the data source"
  value       = data.aws_ami.ubuntu.id
}

output "user_data_log" {
  description = "How to check the bootstrap log on the server"
  value       = "ssh ubuntu@${aws_eip.app.public_ip} 'sudo cat /var/log/user-data.log'"
}
