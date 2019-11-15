import cdk = require('@aws-cdk/core');
import { Properties } from './properties';

export class Config {

    private readonly audience: string;
    private readonly awsAccount: string;
    private readonly awsRegion: string;
    private readonly props: any;

    constructor(env: any, props: any = Properties) {
        this.audience = env.AUDIENCE;
        this.awsAccount = env.AWS_ACCOUNT;
        this.awsRegion = env.AWS_REGION;
        this.props = props;
    }

    getAudience(): string {
        return this.audience;
    }

    getAwsAccount(): string {
        return this.awsAccount;
    }

    getAwsRegion(): string {
        return this.awsRegion;
    }

    getProperty(key: string): any {
        return this.props[key];
    }

    getSubDomainName(): string {
        return ('master' === this.audience) ? '' : `${this.audience}.`;
    }

    getResources() {
        return {
            s3Bucket: {
                webSite: `${this.awsAccount}-${this.audience}-sample-app-web-site`
            }
        };
    }

    addTags(scope: cdk.Construct): void {
        cdk.Tag.add(scope, 'Audience', this.audience);
        cdk.Tag.add(scope, 'Product', 'SampleApp');
    }
}