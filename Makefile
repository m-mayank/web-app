SHEL := /bin/bash

###########################################
#### Vars to be overridden
###########################################

ifndef AWS_ACCOUNT
	export AWS_ACCOUNT := xxxxxxxxxxxx
endif

ifndef AWS_REGION
	export AWS_REGION := eu-west-1
endif

ifndef AUDIENCE
	export AUDIENCE := dev
endif

# Choices: "never" "any-change" "broadening"
ifndef CDK_APPROVAL_LEVEL
	export CDK_APPROVAL_LEVEL := broadening
endif

.PHONY: all test clean

###########################################
#### Deployment commands
###########################################

CDK_TOOLKIT_STACK_NAME := ${AUDIENCE}-cdk-toolkit
CDK_TOOLKIT_BUCKET_NAME := ${AWS_ACCOUNT}-${AUDIENCE}-cdk-staging

cdk-bootstrap:
	cd infrastructure && \
		cdk bootstrap \
		--toolkit-stack-name ${CDK_TOOLKIT_STACK_NAME} \
		--toolkit-bucket-name ${CDK_TOOLKIT_BUCKET_NAME}

cdk-ls:
	cd infrastructure && cdk ls

cdk-synth: nuke-cdk
	cd infrastructure && cdk synth

cdk-diff:
	cd infrastructure && cdk diff || :

deploy: nuke-cdk cdk-bootstrap
	cd infrastructure && \
		cdk deploy '*' \
		--toolkit-stack-name ${CDK_TOOLKIT_STACK_NAME} \
		--require-approval ${CDK_APPROVAL_LEVEL}

cdk-destroy:
	cd infrastructure && cdk destroy
		
###########################################
#### Development
###########################################

nuke: nuke-node-modules nuke-artifacts nuke-logs nuke-cdk

nuke-locks: nuke
	find . -type f -name package-lock.json -exec rm -rf {} +

nuke-node-modules:
	find . -type d -name node_modules -exec rm -rf {} +

nuke-artifacts:
	find . -type d -name build -exec rm -rf {} +

nuke-logs:
	find . -type f -name *-debug.log -exec rm -rf {} +

nuke-cdk:
	find . \
	\( -name cdk.out -o -name .cdk.staging -o -name cdk.context.json \) \
	-exec rm -rf {} +
	
install:
	npm ci
	
start:
	cd modules/web/site && npm run start
	
# To be updated once we have other modules to test
test:
	cd modules/web/site && npm run test

# To be updated once we have other modules to package
package:
	cd modules/web/site && npm run build
	
pipeline: install package deploy
	
pd: package deploy
