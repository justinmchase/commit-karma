import path from 'path'
import { App, Stack } from '@aws-cdk/core'
import { Vpc } from '@aws-cdk/aws-ec2'
import { Cluster, ContainerImage } from '@aws-cdk/aws-ecs'
import { LoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns'
import { Certificate } from '@aws-cdk/aws-certificatemanager'

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
  // domainName: 'git.commitkarma.com', // setup manually in route53
  certificate: Certificate.fromCertificateArn(stack, 'CKCert', 'arn:aws:acm:us-east-1:846793059520:certificate/b35e41d5-f098-4084-ab73-fbc2345f5680'),
  environment: {
    APP_ID: process.env.APP_ID,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    MONGO_URL: process.env.MONGO_URL,
    MONGO_DB: process.env.MONGO_DB
  }
})

app.synth()
