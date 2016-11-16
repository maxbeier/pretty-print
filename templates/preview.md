# {{title}}

_{% if author %}{{ author }}{% endif %}{% if date_published %}, {{ date.strftime('%d.%m.%Y') }}{% endif %}_

  

{{ markdown }}

_{% if url %}From {{ url | lower }}{% endif %}_
