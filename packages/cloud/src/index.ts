import path from 'path'
import { App, Stack } from '@aws-cdk/core'
import { Vpc } from '@aws-cdk/aws-ec2'
import { Cluster, ContainerImage } from '@aws-cdk/aws-ecs'
import { LoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns'

const app = new App()
const stack = new Stack(app, 'CommitKarma', {
  env: {
    region: 'us-east-1'
  }
})

const vpc = new Vpc(stack, 'CKVpc', { maxAzs: 2 })
const cluster = new Cluster(stack, 'CKCluster', { vpc });

new LoadBalancedFargateService(stack, "CKFargateService", {
  cluster,
  image: ContainerImage.fromAsset(path.resolve(__dirname, '..', '..', 'commit-karma')),
  desiredCount: 1,
  enableLogging: true,
  publicLoadBalancer: true,
  cpu: 256,
  memoryLimitMiB: 512,
  containerPort: 3000,
  environment: {
    APP_ID: process.env.APP_ID,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
  }
})

app.synth()
