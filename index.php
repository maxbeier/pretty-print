<?php

$tmp_file = 'tmp.html';
$token = 'cfc76167b2c4ed78ad0c47a7a6ca5e8061b4a498';
$readability_url = 'https://www.readability.com/api/content/v1/parser';
$url = $argv[1];

if (!$url) exit(1);

$call = "$readability_url?url=$url&token=$token";
$response = json_decode(file_get_contents($call), true);
$content = $response['content'];
$title = $response['title'];

file_put_contents($tmp_file, "<h1>$title</h1>$content");
shell_exec("pandoc $tmp_file -o '$title.pdf' --latex-engine=xelatex");
unlink($tmp_file);
