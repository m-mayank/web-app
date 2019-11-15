import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import acm = require('@aws-cdk/aws-certificatemanager');
import cdk = require('@aws-cdk/core');
import cf = require('@aws-cdk/aws-cloudfront');
import route53 = require('@aws-cdk/aws-route53');
import s3 = require('@aws-cdk/aws-s3');

export interface WebStackProps extends cdk.StackProps {
  audience: string;
  baseDomainName: string;
  originAccessIdentityId: string;
  subDomainName: string;
  webSiteBucketName: string;
}
export class WebStack extends cdk.Stack {

  private domainName: string;
  private logBucket: s3.Bucket;
  private hostedZone: route53.HostedZone;
  private webDistribution: cf.CloudFrontWebDistribution;

  constructor(scope: cdk.Construct, id: string, private readonly props: WebStackProps) {
    super(scope, id, props);

    this.domainName = `${this.props.subDomainName}${this.props.baseDomainName}`;
    this.createLogBucket();
    this.hostedZone = this.getHostedZone();
    this.webDistribution = this.createWebDistribution();
    this.createRoute53ARecord();
  }

  private createLogBucket() {
    this.logBucket = new s3.Bucket(this, 'SampleAppLogBucket', {
      bucketName: `${this.account}-${this.props.audience}-sample-app-web-distribution-log`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }

  private getHostedZone(): any {
    return route53.HostedZone.fromLookup(this, 'SampleAppHostedZone', {
      domainName: this.props.baseDomainName,
      privateZone: false
    });
  }

  private createWebDistribution(): cf.CloudFrontWebDistribution {
    const { originAccessIdentityId, webSiteBucketName } = this.props;
    const s3BucketSource = s3.Bucket.fromBucketName(this, 'SampleAppWebSiteBucketRef', webSiteBucketName);
    const certificate = new acm.DnsValidatedCertificate(this, 'SampleAppDomainCertificate', {
      domainName: this.domainName,
      hostedZone: this.hostedZone,
      region: 'us-east-1'
    });

    return new cf.CloudFrontWebDistribution(this, 'SampleAppWebDistribution', {
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [this.domainName]
      },
      comment: `Sample App CF fro Public site and API's`,
      loggingConfig: {
        bucket: this.logBucket
      },
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource,
          originAccessIdentityId
        },
        behaviors: [{
          allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          compress: true,
          forwardedValues: {
            cookies: {
              forward: 'all'
            },
            queryString: true
          },
          isDefaultBehavior: true
        }]
      }],
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    })
  }

  private createRoute53ARecord() {
    new route53.ARecord(this, 'SampleAppWebDistributionARecord', {
      zone: route53.HostedZone.fromHostedZoneAttributes(this, 'SampleAppAudienceHostedZone', {
        hostedZoneId: this.hostedZone.hostedZoneId,
        zoneName: this.domainName
      }),
      target: route53.RecordTarget.fromAlias(new CloudFrontTarget(this.webDistribution))
    })
  }
}