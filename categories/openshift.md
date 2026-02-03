---
layout: page
title: OpenShift
permalink: /blog/categories/OpenShift/
---

<h5> Posts by Category : {{ page.title }} </h5>

{% assign posts = site.categories[page.title] %}
<div class="card">
  {% for post in posts %}
    <li class="category-posts"><span>{{ post.date | date_to_string }}</span> &nbsp; <a href="{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</div>