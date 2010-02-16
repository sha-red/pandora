var site = {};
site.url = "{{settings.URL}}";
site.name = "{{settings.SITENAME}}";

site.pages = {};
{% for page in pages %}
site.pages['{{page.name}}'] = '{{page.body|escapejs}}';
{% endfor %}
