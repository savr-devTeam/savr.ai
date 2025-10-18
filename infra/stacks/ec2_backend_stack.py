from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    CfnOutput,
)
from constructs import Construct


class EC2BackendStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC (use default VPC)
        try:
            vpc = ec2.Vpc.from_lookup(self, "VPC", is_default=True)
        except Exception:
            # If default VPC not found, create a new one
            vpc = ec2.Vpc(self, "VPC", max_azs=2)

        # Create Security Group for the backend
        security_group = ec2.SecurityGroup(
            self,
            "SavrBackendSG",
            vpc=vpc,
            description="Security group for Savr Node.js backend",
            allow_all_outbound=True,
        )
        
        # Allow HTTP and HTTPS traffic
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP"
        )
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS"
        )
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(3001),
            description="Allow Node.js backend"
        )
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH"
        )

        # Create IAM role for EC2
        role = iam.Role(
            self,
            "SavrBackendRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for Savr backend EC2 instance"
        )

        # Add policies for EC2 to access other AWS services
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )

        # User data script to install and run Node.js backend
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "set -e",
            "echo 'Starting backend deployment...'",
            "",
            "# Update system",
            "apt-get update",
            "apt-get install -y curl wget git",
            "",
            "# Install Node.js 22.x",
            "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
            "apt-get install -y nodejs",
            "",
            "# Install PM2 globally for process management",
            "npm install -g pm2",
            "",
            "# Clone the repository or download code",
            "cd /home/ubuntu",
            "git clone https://github.com/savr-devTeam/savr.ai.git",
            "cd savr.ai/backend",
            "",
            "# Install dependencies",
            "npm install",
            "",
            "# Create .env file with production values",
            "cat > .env << 'EOF'",
            "# AWS Cognito Configuration",
            "COGNITO_REGION=us-east-1",
            "COGNITO_USER_POOL_ID=us-east-1_lwFygbjd9",
            "COGNITO_CLIENT_ID=68r61tb357f3dgk0lpsors0bsk",
            "COGNITO_CLIENT_SECRET=your_client_secret_here",
            "COGNITO_DOMAIN=https://us-east-1lwfygbjd9.auth.us-east-1.amazoncognito.com",
            "",
            "# Application URLs - will be updated",
            "BACKEND_URL=http://localhost:3001",
            "FRONTEND_URL=https://savr-ai-one.vercel.app",
            "REDIRECT_URI=https://savr-ai-one.vercel.app/auth/callback",
            "LOGOUT_URI=https://savr-ai-one.vercel.app/",
            "",
            "# Session Configuration",
            "SESSION_SECRET=change_this_to_a_random_secret_in_production",
            "",
            "# Environment",
            "NODE_ENV=production",
            "PORT=3001",
            "EOF",
            "",
            "# Start backend with PM2",
            "pm2 start server.js --name 'savr-backend'",
            "pm2 startup",
            "pm2 save",
            "",
            "echo 'Backend deployment complete!'",
        )

        # Create EC2 instance
        instance = ec2.Instance(
            self,
            "SavrBackendInstance",
            vpc=vpc,
            instance_type=ec2.InstanceType("t3.micro"),  # Free tier eligible
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
            ),
            key_name="savr-backend-key",  # You'll need to create this key pair
            security_group=security_group,
            role=role,
            user_data=user_data,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(20, delete_on_termination=True)
                )
            ]
        )

        # Output the instance details
        CfnOutput(
            self,
            "InstancePublicIP",
            value=instance.instance_public_ip,
            description="Public IP of the backend instance"
        )

        CfnOutput(
            self,
            "InstanceId",
            value=instance.instance_id,
            description="Instance ID of the backend"
        )

        CfnOutput(
            self,
            "BackendURL",
            value=f"http://{instance.instance_public_ip}:3001",
            description="Backend API URL"
        )

        self.instance = instance
