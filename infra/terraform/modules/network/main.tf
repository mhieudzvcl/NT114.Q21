resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.project_name}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-southeast-1a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public-a"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_subnet" "private_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-southeast-1b"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public-b"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.public.id
}
