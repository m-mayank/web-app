import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import cf = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import s3Deploy = require('@aws-cdk/aws-s3-deployment');

export interface WebSiteStackProps extends cdk.StackProps {
  audience: string;
  deployAssetPath: string;
  webSiteBucketName: string;
}
export class WebSiteStack extends cdk.Stack {

  private webSiteBucket: s3.Bucket;
  private cfOriginAccessId: cf.CfnCloudFrontOriginAccessIdentity;

  constructor(scope: cdk.Construct, id: string, private readonly props: WebSiteStackProps) {
    super(scope, id, props);

    this.createOriginAccessId()
    this.createWebSiteBucket();
    this.deployWebSite();
  }

  getCfOriginAccessIdRef(): string {
    return this.cfOriginAccessId.ref;
  }

  private createOriginAccessId() {
    this.cfOriginAccessId = new cf.CfnCloudFrontOriginAccessIdentity(this, 'SampleAppWebSiteOAI', {
      cloudFrontOriginAccessIdentityConfig: {
        comment: `OAI for ${this.props.audience} Sample App Wesbite`
      }
    })
  }

  private createWebSiteBucket() {
    this.webSiteBucket = new s3.Bucket(this, 'SampleAppWebSiteBucket', {
      bucketName: this.props.webSiteBucketName,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    this.webSiteBucket.addToResourcePolicy(this.getBucketPolicy());
  }

  private getBucketPolicy(): iam.PolicyStatement {
    const policyStatement = new iam.PolicyStatement();
    policyStatement.addActions('s3:GetBucket*');
    policyStatement.addActions('s3:GetObject*');
    policyStatement.addActions('s3:List*');
    policyStatement.addResources(this.webSiteBucket.bucketArn);
    policyStatement.addResources(`${this.webSiteBucket.bucketArn}/*`);
    policyStatement.addCanonicalUserPrincipal(this.cfOriginAccessId.attrS3CanonicalUserId);

    return policyStatement;
  }

  private deployWebSite() {
    new s3Deploy.BucketDeployment(this, 'SampleAppWebSitDeploy', {
      sources: [s3Deploy.Source.asset(this.props.deployAssetPath)],
      destinationBucket: this.webSiteBucket,
      retainOnDelete: false,
    });
  }
}