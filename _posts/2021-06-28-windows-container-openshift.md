---
layout: post
title:  "Windows Containers on Red Hat OpenShift: Does That Make Sense?"
summary:  "For a long time, Red Hat has been establishing Linux as the main operating system for Containers. In the past, you would hear Red Hat “Containers are Linux.” But now Red Hat is also bringing Windows as one of the supported Operating Systems for Workers on Red Hat OpenShift. Does that seem strange to you? Why is this movement happening? Follow me in this article to understand more about what is behind this movement. We will take a dive into some numbers and try to demystify the reasons for them. You will also see some possible strategies to move your Windows workload into Red Hat OpenShift Container Platform."
date:   '2021-06-28 00:05:55 +0300'
thumbnail:  /assets/img/posts/2021-06-28-windows-container-openshift/title.png
keywords:   ['OpenShift', 'Windows']
category:   ['OpenShift']
author: gfontana
lang: en
lang-ref: 2021-06-28-windows-container-openshift
permalink: /blog/2021-06-28-windows-container-openshift/
usemathjax: true
---

*Originally published at [https://redhat.com/en/blog](https://www.redhat.com/en/blog/windows-containers-on-red-hat-openshift-does-that-make-sense) on June 28, 2021.*

Why Windows on OpenShift?
-------------------------

Red Hat OpenShift workers with ... Windows? Perhaps it may seem strange to you; it seemed a bit strange to me at first as well. However, after seeing some numbers, I realized that this is a natural growing movement for the Containers ecosystem, in which Red Hat is one of the most active collaborators. Let’s see some numbers to understand that better. 

Although the growth rate of Red Hat Enterprise Linux is much greater than Windows, Windows still has a very strong presence among server operating systems in the data center, as you can see in the pie chart below, from research by IDC in 2018 (see [here](https://www.redhat.com/pt-br/blog/red-hat-leading-enterprise-linux-server-market)):

![](/assets/img/posts/2021-06-28-windows-container-openshift/01.png)

This data, combined with the digital transformation movement we have been experiencing in recent years, gives us a real notion of the huge amount of effort that the market probably will demand from transformation and modernization in the next few years. Research in 2019 with more than 1,000 respondents from all regions stated that almost half of them were still in the early phase of the digital transformation:

![](/assets/img/posts/2021-06-28-windows-container-openshift/02.png)

Source: 2020 Red Hat Global Customer Tech Outlook survey. Conducted by Red Hat via Qualtrics, August-September 2019. Q1. Currently, where is your company in its journey to digital transformation? n=873.

This same research pointed out that “Optimizing existing IT” was still a top priority at that time. Of course, this scenario may have changed a bit after the pandemic started in 2020, but that only complicates the IT situation because t **it is hard to innovate without getting existing IT in order first**. Many companies are struggling to optimize their existing legacy applications and infrastructure while, at the same time, the industry is pushing them to innovate more. If you want to see more of this report, access it [here](https://www.redhat.com/en/resources/global-tech-outlook-2020). 

![](/assets/img/posts/2021-06-28-windows-container-openshift/03.png)

_Source: 2020 Red Hat Global Customer Tech Outlook survey. Conducted by Red Hat via Qualtrics, August-September 2019._ _Q4. Over the next 12 months, what are your company's top IT technology funding priorities?  Please select up to 3 of the top areas your company is investing. n=674._

Here is when Windows on OpenShift makes real sense. A huge amount of existing IT workloads run on Windows Servers only. With this movement, **Red Hat allows many customers to move existing Windows workloads into OpenShift with very low friction and optimize them with many benefits of the containerization,** as part of an Enterprise Kubernetes cluster.

Have you considered the benefits of having standard Kubernetes/OpenShift features with your existing Windows workloads? Features that are standard with OpenShift for many years now are available for Windows Server workloads also. **Now you may have the benefits of features like self-healing, secret and configuration management, scaling, resilience, decoupled applications (from infrastructure), service discovery, and load balancing by moving the Windows workloads as containers on OpenShift.**

However, keep in mind that Windows on OpenShift is still evolving, and some features are not available or not under development yet. Here are a few of them:

*   Serverless
*   OpenShift Pipelines
*   Service Mesh

Now that we have already discussed why Red Hat is making this investment and the benefits you may have with that, let’s look briefly at how to move a Windows workload to OpenShift.

How to Move Windows Workloads to OpenShift
------------------------------------------

There is not only one strategy to move Windows workloads to OpenShift. Let’s discuss the main strategies to do that.

![](/assets/img/posts/2021-06-28-windows-container-openshift/04.png)

Rehost
------

Red Hat OpenShift has the ability to host VMs with the **OpenShift Virtualization** feature based on the KubeVirt upstream project in which you can collocate VMs with Containers in the same OpenShift cluster. This is the lowest friction (lift and shift) you have to migrate to OpenShift as you will not need to refactor the application to run as a container; however, you will not have many benefits that the containerization might bring, like a lighter footprint and decoupled applications.

Refactor
--------

If the application is compatible with Windows Server 2019, you may choose to refactor it as a Windows container. As such, you will be able to have all the benefits of containerization on OpenShift, as we have covered in this article. 

Rearchitect/Rebuild
-------------------

With this strategy, the application will be rebuilt using .Net Core, which is Linux compatible, and you will be able to deploy it in any OpenShift cluster. You may also decide to rearchitect the application entirely using some modern cloud-native framework. In general, these applications are fragmented into micro-services that use API gateway, in-memory databases, serverless functions, and many other modern middleware layers. As such and in general, this strategy requires much more effort and is time-consuming, but it does make sense for “Mode 2” applications that require a rapid path (or IT “fast lane”) to transform business ideas into features and changes.

Red Hat OpenShift: The Complete Set of Workloads
------------------------------------------------

![](/assets/img/posts/2021-06-28-windows-container-openshift/05.png)

In this article, we saw why it makes sense to bring more different kinds of workloads to OpenShift. Red Hat is making this a reality by bringing together the regular Red Hat CoreOS/RHEL worker nodes, Virtual Machines with OpenShift Virtualization, and now the Windows Containers running on MS Windows Servers 2019. 

Ready to move your Windows workloads to Red Hat OpenShift? See [here](https://www.openshift.com/learn/topics/windows-containers) how to try it or talk to a Red Hatter by filling [this form](https://www.redhat.com/en/contact).