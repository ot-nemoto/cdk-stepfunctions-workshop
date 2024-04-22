import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

export class CdkStepfunctionsWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const wait = new sfn.Wait(this, 'Wait for Timer', {
      time: sfn.WaitTime.secondsPath('$.timer_seconds'),
    });

    const succeed = new sfn.Succeed(this, 'Success', {});

    const definition = wait.next(succeed);

    new sfn.StateMachine(this, 'StateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
    });
  }
}
