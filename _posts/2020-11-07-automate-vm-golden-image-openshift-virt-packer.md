---
layout: post
title:  "Automate VM golden image builds for OpenShift with Packer"
summary:  "In any virtualized environment, maintaining consistency across virtual machines (VMs) is a major challenge. Golden images(pre-configured VM templates) are the industry-standard solution. They ensure every new VM comes with the correct OS settings, security patches, and monitoring tools baked in. But how do you create and manage these images without tedious manual work?"
date:   '2025-11-07 00:05:55 +0300'
thumbnail:  /assets/img/posts/2020-11-07-automate-vm-golden-image-openshift-virt-packer/banner.jpg
keywords:   ['OpenShift', 'Packer', 'Kubevirt']
category:   ['OpenShift', 'Packer', 'Kubevirt']
author: gfontana
lang: en
lang-ref: automate-vm-golden-image-openshift-virt-packer
permalink: /blog/automate-vm-golden-image-openshift-virt-packer/
usemathjax: true
---
*Originally published at [https://developers.redhat.com](https://developers.redhat.com/articles/2025/11/07/automate-vm-golden-image-builds-openshift-packer) on November 07, 2025.*

In any virtualized environment, maintaining consistency across virtual machines (VMs) is a major challenge. Golden images (pre-configured VM templates) are the industry-standard solution. They ensure every new VM comes with the correct OS settings, security patches, and monitoring tools baked in. But how do you create and manage these images without tedious manual work?

This is where Packer comes into the picture. Packer is a tool that automates the creation of identical machine images for multiple platforms from a single template. In this article, we'll show you how to use Packer with the KVM plugin to build golden images specifically for Red Hat OpenShift Virtualization.

## Packer
Packer allows you to create images from a single source template, described using either HashiCorp Configuration Language (HCL) or JSON. It provides a large collection of plugins to create machines and images for different platforms, such AWS, Azure, VMware, KVM, and others. Refer to the [Packer Integrations](https://www.packer.io/plugins) page for more information.

## Red Hat OpenShift Virtualization
Red Hat OpenShift Virtualization, built on KubeVirt, is a feature of Red Hat OpenShift that allows you to run and manage traditional virtual machines alongside containers on a single, hybrid cloud platform. This unification of both containerized and virtualized workloads simplifies management and enables a consistent operational experience across your entire infrastructure.

### Packer + OpenShift Virtualization: Better together
Through the KVM plugin and with a few simple commands, you can make your golden image ready on OpenShift Virtualization. The [GitHub repository](https://github.com/redhat-cop/openshift-virt-packer) includes a collection of examples for creating images for various operating systems, including Linux (Fedora, RHEL 9) and Windows.

Later in this article, we will dig into one of these examples, but the general workflow is simple. You define a Packer template (HCL) that specifies the operating system, configuration scripts, and other customizations. Packer then uses this template to build the VM image automatically using KVM. The output will be a qcow2 image file for you to upload to OpenShift Virtualization and use as a golden image for your VM provisioning.

Once Packer completes the qcow2 file creation, uploading it to OpenShift and setting it as a bootable image are steps easily automated as part of a pipeline or with automation tools like Red Hat Ansible Automation Platform or Terraform.

### Key features and benefits:
* **Automation:** Eliminate tedious manual image creation, saving time and preventing configuration drift.
* **Customization:** Easily embed specific software, user configurations, and security settings directly into the image.
* **Performance optimization:** Build images with the best drivers for your environment, like using virtio drivers for Windows on KVM to achieve near-native performance.
* **Reduced risk:** Automating the image creation process ensures a standardized and less error-prone approach compared to manual methods.
* **Simple integration:** The build process outputs a qcow2 file that can upload to OpenShift Virtualization with a few simple commands, perfect for CI/CD pipelines.

## Getting started
The project's GitHub repository provides detailed instructions on how to get started. Here's a quick overview of the steps involved:

1.  **Clone the repository:** Obtain a local copy of the project.
2.  **Install Packer and KVM:** Install Packer on your system.
3.  **Choose an example:** The repository includes examples for different operating systems.
4.  **Build the image:** Run the Packer build command to create your custom VM image.
5.  **Upload to OpenShift:** Use the `virtctl` and `oc` command-line tool to upload the image to OpenShift Virtualization.

Let's walk through the Windows Server 2019 example to see how the automation comes together. The `windows2019.pkr.hcl` Packer template defines the process and orchestrates the entire build.

The source block defines the crucial first step, where Packer creates and attaches a virtual CD-ROM to the new VM. This CD contains all the files needed for an unattended installation:

```hcl
# This creates a virtual CD with our automation files and drivers.
cd_files = [
  "./autounattend.xml",
  "./scripts/Configure-WinRM.ps1",
  "./virtio/"
]
cd_label = "PACKERDRV" # A label for our driver CD
```

The Windows installer then uses the `autounattend.xml` file from this virtual CD as its answer file to automate the setup. Inside this XML file, we point the installer to the virtio drivers, also located on the virtual CD (which typically mounts as the E: drive). This allows Windows to use the high-performance KVM-native storage and network drivers right from the start.

```xml
<DriverPaths>
    <PathAndCredentials wcm:action="add" wcm:keyValue="1">
        <Path>E:\virtio\viostor\2k19\amd64</Path>
    </PathAndCredentials>
    <PathAndCredentials wcm:action="add" wcm:keyValue="2">
        <Path>E:\virtio\NetKVM\2k19\amd64</Path>
    </PathAndCredentials>
</DriverPaths>
```

After the OS installation is complete, the `autounattend.xml` file has one more critical job. The `FirstLogonCommands` section automatically runs our PowerShell script.

```xml
<FirstLogonCommands>
    <SynchronousCommand wcm:action="add">
        <CommandLine>powershell.exe -ExecutionPolicy Bypass -File E:\Configure-WinRM.ps1</CommandLine>
        <Description>Install and Configure SSH</Description>
        <Order>1</Order>
    </SynchronousCommand>
</FirstLogonCommands>
```

This script configures Windows Remote Management (WinRM), which opens a communication channel back to Packer. Once Packer can connect to the VM via WinRM, it takes over to run post-install configurations. In this example, it executes scripts to install Windows updates before finalizing the qcow2 image.

## From image to OpenShift VM
Once Packer creates the qcow2 file, the final step is to make it available in OpenShift Virtualization:

1.  **Upload the image:** First, you upload the qcow2 file, which creates a Persistent Volume Claim (PVC) that serves as a bootable volume for your new virtual machines.
2.  **Create a template (optional):** For better reusability, you can create a custom VM template that points to this new bootable volume. This allows developers and operators to provision new, fully configured VMs with just a few clicks from the OpenShift console.

For organizations managing multiple OpenShift clusters, distributing and managing these golden images can be streamlined using Red Hat Advanced Cluster Management (RHACM). RHACM policies can automate the distribution of these templates and their associated resources across your entire fleet, ensuring consistency and saving significant operational effort.

The repository's `README.md` file provides detailed instructions for this, including an example of how to use Red Hat Advanced Cluster Management policies to distribute these images across multiple clusters.

## Simplify your VM images on OpenShift
By automating the VM image creation process, teams improve efficiency, consistency, and scalability. Whether you're a developer, a system administrator, or a DevOps engineer, the powerful combination of Packer and OpenShift Virtualization can help you streamline your workflows and make the most of your platform.

If you're ready to streamline how you manage VM images on OpenShift, dive into the [openshift-virt-packer repository](https://github.com/redhat-cop/openshift-virt-packer). Clone it, run an example, and start building your own automated image pipeline today with Packer and OpenShift Virtualization. You can also find more information in the [Packer and OpenShift Virtualization - Managing VMs](https://docs.redhat.com/) documentation.

To learn more about Red Hat OpenShift Virtualization, check out the [15 reasons to adopt Red Hat OpenShift Virtualization](https://www.redhat.com/en/resources/15-reasons-to-adopt-openshift-virtualization-ebook) e-book and explore how to build a migration plan with Red Hat experts through the [Virtualization Migration Assessment](https://www.redhat.com/en/services/consulting/virtualization-migration-assessment).