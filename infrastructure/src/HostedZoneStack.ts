import cdk = require('@aws-cdk/core');
import route53 = require('@aws-cdk/aws-route53');

export interface SecurityStackProps extends cdk.StackProps {
  audience: string;
  baseDomainName: string;
}

export class HostedZoneStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, private readonly props: SecurityStackProps) {
    super(scope, id, props);

    this.createHostedZone();
  }

  private createHostedZone() {
    new route53.PublicHostedZone(this, 'SampleAppHostedZone', {
      zoneName: this.props.baseDomainName,
      comment: 'Hosted Zone for SAmple App'
    });
  }
}