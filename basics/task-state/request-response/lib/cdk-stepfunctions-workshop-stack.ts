import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';

export class CdkStepfunctionsWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
