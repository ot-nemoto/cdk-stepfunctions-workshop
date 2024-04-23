import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class CdkStepfunctionsWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'BatchVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [],
      natGateways: 0,
    });
    // Subnet
    const subnet = new ec2.Subnet(this, 'BatchSubnet', {
      vpcId: vpc.vpcId,
      availabilityZone: 'ap-northeast-1a',
      cidrBlock: '10.0.0.0/24',
    });
    // InternetGateway
    const igw = new ec2.CfnInternetGateway(this, 'BatchInternetGateway', {});
    new ec2.CfnVPCGatewayAttachment(this, 'BatchVPCGatewayAttachment', {
      internetGatewayId: igw.ref,
      vpcId: vpc.vpcId,
    });
    // SecurityGroup
    const securityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: vpc,
      description: 'A security group for region-agnostic Batch resources',
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS'
    );
    // Route
    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: subnet.routeTable.routeTableId,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    const snsTopic = new sns.Topic(this, 'SNSTopic', {
      displayName: 'RequestResponseTopic',
    });

    const wait = new sfn.Wait(this, 'Wait for Timestamp', {
      time: sfn.WaitTime.secondsPath('$.timer_seconds'),
    });

    const taskSns = new tasks.SnsPublish(this, 'Send SNS Message', {
      topic: snsTopic,
      message: sfn.TaskInput.fromText('Hello from Step Functions!'),
    });

    const definition = wait.next(taskSns);

    new sfn.StateMachine(this, 'StateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      comment:
        'An example of the Amazon States Language for scheduling a task.',
    });
  }
}
