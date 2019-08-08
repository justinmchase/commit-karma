"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var core_1 = require("@aws-cdk/core");
var aws_ec2_1 = require("@aws-cdk/aws-ec2");
var aws_ecs_1 = require("@aws-cdk/aws-ecs");
var aws_ecs_patterns_1 = require("@aws-cdk/aws-ecs-patterns");
var app = new core_1.App();
var stack = new core_1.Stack(app, 'CommitKarma', {
    env: {
        region: 'us-east-1'
    }
});
var vpc = new aws_ec2_1.Vpc(stack, 'CKVpc', { maxAzs: 2 });
var cluster = new aws_ecs_1.Cluster(stack, 'CKCluster', { vpc: vpc });
new aws_ecs_patterns_1.LoadBalancedFargateService(stack, "CKFargateService", {
    cluster: cluster,
    image: aws_ecs_1.ContainerImage.fromAsset(path_1.default.resolve(__dirname, '..', '..', 'commit-karma')),
    desiredCount: 1,
    enableLogging: true,
    publicLoadBalancer: true,
    cpu: 256,
    memoryLimitMiB: 512,
    containerPort: 8080,
    environment: {
    // ...
    }
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw4Q0FBdUI7QUFDdkIsc0NBQTBDO0FBQzFDLDRDQUFzQztBQUN0Qyw0Q0FBMEQ7QUFDMUQsOERBQXNFO0FBRXRFLElBQU0sR0FBRyxHQUFHLElBQUksVUFBRyxFQUFFLENBQUE7QUFDckIsSUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFLLENBQUMsR0FBRyxFQUFFLGFBQWEsRUFBRTtJQUMxQyxHQUFHLEVBQUU7UUFDSCxNQUFNLEVBQUUsV0FBVztLQUNwQjtDQUNGLENBQUMsQ0FBQTtBQUVGLElBQU0sR0FBRyxHQUFHLElBQUksYUFBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUNsRCxJQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxFQUFFLEdBQUcsS0FBQSxFQUFFLENBQUMsQ0FBQztBQUV6RCxJQUFJLDZDQUEwQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRTtJQUN4RCxPQUFPLFNBQUE7SUFDUCxLQUFLLEVBQUUsd0JBQWMsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNwRixZQUFZLEVBQUUsQ0FBQztJQUNmLGFBQWEsRUFBRSxJQUFJO0lBQ25CLGtCQUFrQixFQUFFLElBQUk7SUFDeEIsR0FBRyxFQUFFLEdBQUc7SUFDUixjQUFjLEVBQUUsR0FBRztJQUNuQixhQUFhLEVBQUUsSUFBSTtJQUNuQixXQUFXLEVBQUU7SUFDWCxNQUFNO0tBQ1A7Q0FDRixDQUFDLENBQUE7QUFFRixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUEifQ==