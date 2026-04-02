module "network" {
  source       = "../../modules/network"
  project_name = var.project_name
}

module "eks" {
  source         = "../../modules/eks"
  project_name   = var.project_name
  vpc_id         = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
}

output "cluster_name" {
  value = module.eks.cluster_name
}
