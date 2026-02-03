---
layout: post
title:  "Deploying a Private OpenShift Cluster on AWS using Transit Gateway"
summary:  "AWS Transit Gateway is a service introduced in 2018 by AWS to facilitate the interconnection configuration between multiple VPCs and on-premises networks. In this article, we will build an environment from scratch on AWS with numerous VPCs, use Transit Gateway to interconnect them, and deploy a private Red Hat OpenShift on AWS (ROSA) cluster, which uses PrivateLink to enable communication between the Red Hat SREs and the private subnets on AWS."
date:   '2022-08-31 00:05:55 +0300'
thumbnail:  /assets/img/posts/2022-08-31-rosa-transit-gateway/05.png
category: ['OpenShift','AWS']
keywords:   ['OpenShift', 'AWS']
author: gfontana
lang: en
lang-ref: 2022-08-31-rosa-transit-gateway
permalink: /blog/2022-08-31-rosa-transit-gateway/
usemathjax: true
---

These are the steps we are going to follow:

1.  VPCs creation;
2.  Transit Gateway and route table configuration;
3.  Deployment of a Red Hat OpenShift on AWS (ROSA) cluster using the OpenShift Cluster Manager on console.redhat.com;
4.  Publishing DNS in the public VPC;
5.  Deployment of a Jump server to access the private subnets.

---

# VPCs Creation

We are going to create 3 VPCs:

1.  **Egress VPC**: This VPC is the only public one, which has an Internet and NAT Gateway. All egress traffic flows through this VPC. Our jump server will also be in this VPC, as it is the only one with public internet access.
2.  **ROSA VPC**: Private VPC in which we are going to install the Red Hat OpenShift on AWS (ROSA) cluster.
3.  **Other VPC**: This VPC would represent other services that applications on OpenShift would be interacting with, such as Databases, APIs, etc.

The following table has the details of the VPCs we are going to create:

| VPC Name | CIDR block | Subnets |
| :--- | :--- | :--- |
| **egress-vpc** | 10.0.0.0/24 | **us-east-1a**<br>egress-subnet-public1-us-east-1a - 10.0.0.0/28<br>egress-subnet-private1-us-east-1a - 10.0.0.128/28 |
| **ocp-vpc** | 10.1.0.0/16 | **us-east-1a**<br>ocp-subnet-private1-us-east-1a - 10.1.128.0/20<br>**us-east-1b**<br>ocp-subnet-private2-us-east-1b - 10.1.144.0/20<br>**us-east-1c**<br>ocp-subnet-private3-us-east-1c - 10.1.160.0/20 |
| **integration-vpc** | 10.2.0.0/16 | **us-east-1a**<br>integration-subnet-private1-us-east-1a - 10.2.128.0/20<br>**us-east-1b**<br>integration-subnet-private2-us-east-1b - 10.2.144.0/20<br>**us-east-1c**<br>integration-subnet-private3-us-east-1c - 10.2.160.0/20 |

Follow the steps below to create the VPCs:

1.  Access your AWS account and navigate to the VPC feature of the desired region.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/01.png)

2.  Click on **Create VPC** button on the top right corner of the screen.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/02.png)

3.  Fill out the form for the **egress-vpc**:
    - **Resources to create**: VPC and more
    - **Name tag auto-generation**: egress
    - **IPv4 CIDR block**: 10.0.0.0/24 (*)
    - **IPv6 CIDR block**: No IPv6 CIDR block
    - **Number of Availability Zones (AZs)**: 1
    - **Number of public subnets**: 1
    - **Number of private subnets**: 1
    - **Public subnet CIDR block in us-east-1a**: 10.0.0.0/28 (*)
    - **Private subnet CIDR block in us-east-1a**: 10.0.0.128/28 (*)
    - **NAT gateways ($)**: In 1 AZ
    - **VPC endpoints**: S3 Gateway
    - **Enable DNS hostnames**: enabled
    - **Enable DNS resolution**: enabled

(*) You may customize the CIDR ranges as you need, just make sure there are no overlaps between the CIDRs of each VPCs and subnets.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/03.png)

4.  Repeat the same thing to create the **OpenShift VPC (ocp-vpc)**:
    - **Resources to create**: VPC and more
    - **Name tag auto-generation**: ocp
    - **IPv4 CIDR block**: 10.1.0.0/16 (*)
    - **Number of Availability Zones (AZs)**: 3
    - **Number of public subnets**: 0
    - **Number of private subnets**: 3
    - **Private subnet CIDR block (1a, 1b, 1c)**: 10.1.128.0/20, 10.1.144.0/20, 10.1.160.0/20
    - **NAT gateways ($)**: None
    - **VPC endpoints**: S3 Gateway
    - **Enable DNS hostnames/resolution**: enabled

5.  Finally, create the **integration-vpc**:
    - **Resources to create**: VPC and more
    - **Name tag auto-generation**: integration
    - **IPv4 CIDR block**: 10.2.0.0/16 (*)
    - **Number of Availability Zones (AZs)**: 3
    - **Number of public subnets**: 0
    - **Number of private subnets**: 3
    - **Private subnet CIDR block (1a, 1b, 1c)**: 10.2.128.0/20, 10.2.144.0/20, 10.2.160.0/20
    - **NAT gateways ($)**: None

# Transit Gateway and route table configuration

1.  With VPCs created we can go ahead and create the Transit Gateway. Access the **Transit Gateway** menu and click on **Create transit gateway**. Give it a name and wait until the state is **Available**.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/04.png)

2.  On the screen give it a name and click on **Create transit gateway attachments**.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/05.png)

3. Wait one minute or two until you see the transit gateway state as Available:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/06.png)

4.  Now we need to create **Transit gateway attachments** for each VPC. Access the **Transit gateway attachments** menu and click on **Create transit gateway attachment** button:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/07.png)

5.  Give the name egress-tga, select the transit gateway that has been just created, egress-vpc, leave all subnets enabled, and click on **Create transit gateway attachment** button.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/08.png)

6. Repeat the same step for ocp-vpc and integration-vpc. Wait some minutes until all TGA state is Available.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/09.png)

7. Now access Transit gateway route tables and click on the one that has been automatically created with the TGW.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/10.png)

8. Access the Routes tab and click on Create static route button.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/11.png)

9. Add the following route:
    - **CIDR**: 0.0.0.0/0
    - **Attachment**: egress-tga

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/12.png)

10. We need to configure the egress private subnet route table to allow network packages to return back to the VPCs using the transit gateway. To do so, access one of the egress public subnets and click over the route table link:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/13.png)

11. Then click on the Routes tab and Edit routes button.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/14.png)

12. Add the following routes:
    - **10.1.0.0/16** - Transit Gateway
    - **10.2.0.0/16** - Transit Gateway

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/15.png)

13. Finally, we need to add the following rule on all subnets of ocp and integration VPCs to enable these subnets to use the Transit Gateway. To do so, click on the subnet, access the Route table tab, and click over the Route table link:
    - **0.0.0.0/0** - Transit Gateway

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/16.png)

14. Click on Edit routes:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/17.png)

15. Add the rule:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/18.png)

This concludes the configuration required on Transit Gateway and route tables. See next how to install Red Hat OpenShift for AWS (ROSA) on this infrastructure.

# Deployment of a Red Hat OpenShift on AWS (ROSA) cluster

First, access the Red Hat Hybrid Cloud console: [https://console.redhat.com/openshift/create](https://console.redhat.com/openshift/create). If you don’t have an account use the link Register for a Red Hat account to create one. Click on Create cluster button next to the Red Hat OpenShift Service on AWS (ROSA).

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/19.png)

The first step required is to link your AWS account to your Red Hat console. To do so you will need a workstation with the AWS CLI installed and configured beforehand. Look at the references at the end of this article if you need instructions on how to install and use the AWS CLI. On the first page, click on the Associated AWS account combo box and Associate AWS account button.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/20.png)

Follow the instructions on the screen to download the rosa cli:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/21.png)

Copy the rosa login command and run it from your workstation.

```bash
$ rosa login --token="eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2*********"
I: Logged in as '******' on 'https://api.openshift.com'

$ rosa create ocm-role --admin
I: Creating ocm role
? Role prefix: ManagedOpenShift
? Permissions boundary ARN (optional): 
? Role creation mode: auto
I: Creating role using 'arn:aws:iam::********:user/*****@******-admin'
? Create the 'ManagedOpenShift-OCM-Role-11009103' role? Yes
I: Created role 'ManagedOpenShift-OCM-Role-11009103' with ARN 'arn:aws:iam::839138491912:role/ManagedOpenShift-OCM-Role-11009103'
I: Linking OCM role
? OCM Role ARN: arn:aws:iam::*********:role/ManagedOpenShift-OCM-Role-11009103
? Link the 'arn:aws:iam::*********:role/ManagedOpenShift-OCM-Role-11009103' role with organization '**********'? Yes
I: Successfully linked role-arn 'arn:aws:iam::*********:role/ManagedOpenShift-OCM-Role-11009103' with organization account '**********'

$ rosa create user-role
I: Creating User role
? Role prefix: ManagedOpenShift
? Permissions boundary ARN (optional): 
? Role creation mode: auto
I: Creating ocm user role using 'arn:aws:iam::*******:user/******@*****-admin'
? Create the 'ManagedOpenShift-User-******-Role' role? Yes
I: Created role 'ManagedOpenShift-User-******-Role' with ARN 'arn:aws:iam::*******:role/ManagedOpenShift-User-******-Role'
I: Linking User role
? User Role ARN: arn:aws:iam::******:role/ManagedOpenShift-User-******-Role
? Link the 'arn:aws:iam::839138491912:role/ManagedOpenShift-User-******-Role' role with account '*****'? Yes
I: Successfully linked role ARN 'arn:aws:iam::******:role/ManagedOpenShift-User-******-Role' with account '*********'
```

After you run these commands successfully, you should now see your AWS account listed in the Associated AWS account combobox:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/22.png)

You will still see the following message, indicating that you need to create the account roles.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/23.png)

To do so, run the command as described in the message:

```bash
$ rosa create account-roles
I: Logged in as '*****' on 'https://api.openshift.com'
I: Validating AWS credentials...
I: AWS credentials are valid!
I: Validating AWS quota...
I: AWS quota ok. If cluster installation fails, validate actual AWS resource usage against https://docs.openshift.com/rosa/rosa_getting_started/rosa-required-aws-service-quotas.html
I: Verifying whether OpenShift command-line tool is available...
(...)
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-machine-api-aws-cloud-credentials'
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-cloud-credential-operator-cloud-crede'
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-image-registry-installer-cloud-creden'
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-ingress-operator-cloud-credentials'
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-cluster-csi-drivers-ebs-cloud-credent'
I: Created policy with ARN 'arn:aws:iam::****:policy/ManagedOpenShift-openshift-cloud-network-config-controller-cloud'
I: To create a cluster with these roles, run the following command:
rosa create cluster --sts
```

Now click on Refresh ARNs button and we should be good to go:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/24.png)

On the next page fill out the Cluster name and set the Availability to Multi-zone. 

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/25.png)

Change the machine pool size if you want or leave it as-is:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/26.png)

Change the Cluster privacy to Private:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/27.png)

Now copy the private subnet IDs from the ocp VCP we created before and paste here:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/28.png)

Set the Machine CIDR to the same range you used with the ocp VPC:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/29.png)

You don’t need to change the Cluster roles and policies.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/30.png)

Set the update strategy according to what you need:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/31.png)

Now review the information provided and start the cluster provisioning:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/32.png)

You will need to wait from 40 minutes to 1 hour to have your cluster available:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/33.png)

When the cluster is available you will be automatically redirected to a page with the main details of your cluster.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/34.png)

To access our cluster we need to add an identity provider and a cluster-admin user. Click in the Access control tab, then Identity providers and select the HTPasswd:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/35.png)

Now set the desired admin user and password:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/36.png)

Now go back to the Access control tab and click on Add user button at Cluster Roles and Access feature.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/37.png)

Add the user you just created as a cluster-admin.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/38.png)

To check the console URL, click on the Open console button. You will not be able to access the console, as expected, as this is a private cluster.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/39.png)

We are going to use a jump server to access the console.

# Publishing DNS in the public VPC

Our cluster is private, so the DNS domain created by ROSA is. To be able to access the console and applications from the egress VPC, we should add this VPC to the DNS domain created by ROSA. To do so, access the AWS Route-53 of your AWS account, access the domain created by ROSA (it ends with openshiftapps.com), and click on the Edit hosted zone button.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/40.png)

Now add the egress VPC in this domain:

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/41.png)

# Deployment of a Jump server to access the private subnets

Now launch a new instance to be our jump server. You can provision any OS you prefer, such as Windows, Fedora, Red Hat, or Ubuntu that has a GUI with a supported browser version (Firefox, Chrome, or Edge). Make sure you select the egress VPC and the public subnet. Assign a public IP and use it to connect to that instance.

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/42.png)

Connect to the instance using your preferred remote desktop tool, you should be able to access the OpenShift console from there and login using the user you defined before. 

![Screenshot](/assets/img/posts/2022-08-31-rosa-transit-gateway/43.png)

In this article we created from scratch the AWS VPCs infrastructure, connected them using a Transit Gateway and installed a Red Hat OpenShift on AWS (ROSA) in one of the private VPC. If you are interested in deploying an OpenShift cluster in a private AWS VPC, this is one of the ways to do that.

# References:

* Installing or updating the latest version of the AWS CLI: [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* AWS CLI Configuration: [https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)