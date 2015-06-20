<?php
/**
 * clear
 * doGet
 * doPost
 */

$c = !empty($_GET['c']) ? $_GET['c'] : null;
$commands = ['clear', 'doGet', 'doPost'];

$func = in_array($c, $commands) ? $c : 'doUnknown';

header('Content-type:application/json; charset=utf-8');

try
{
    $result = $func();
    echo json_encode($result);
}
catch (Exception $e)
{
    echo json_encode(['error' => $e->getMessage()]);
}
exit();

//----------------------------------------------------------------------------------------------------------------------

function getCookieFile()
{
    $sid = !empty($_POST['sid']) ? $_POST['sid'] : null;
    $sid = preg_replace('@[^A-Za-z0-9]@', '', $sid);
    if (strlen($sid) != 32) throw new Exception('no sid');

    return dirname(__FILE__).'/curl/cookies/'.$sid.'.txt';
}

function prepareCurl()
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_AUTOREFERER, true);
    //curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 7);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
    //curl_setopt($ch, CURLOPT_BUFFERSIZE, 64*1024);
    //curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:38.0) Gecko/20100101 Firefox/38.0');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Connection: keep-alive',
        //'Accept-Encoding: gzip, deflate'
    ]);
    $cookieFile = getCookieFile();
    curl_setopt($ch, CURLOPT_COOKIESESSION, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($ch, CURLOPT_VERBOSE, true);
    $logFile = dirname(__FILE__).'/curl/verbose.log';
    $lfp = fopen($logFile, 'w+');
    curl_setopt($ch, CURLOPT_STDERR, $lfp);

    $headerFile = dirname(__FILE__).'/curl/header.log';
    $hfp = fopen($headerFile, 'w+');
    curl_setopt($ch, CURLOPT_WRITEHEADER, $hfp);

    $bodyFile = dirname(__FILE__).'/curl/body.log.log';
    $bfp = fopen($bodyFile, 'w+');
    curl_setopt($ch, CURLOPT_FILE, $bfp);


    return $ch;
}


function clear()
{
    $cookieFile = getCookieFile();
    if (file_exists($cookieFile)) unlink($cookieFile);

    return new stdClass();
}

function doGet()
{
    $url = !empty($_POST['url']) ? $_POST['url'] : null;
    if (!$url)  throw new Exception('no url');

    $ch = prepareCurl();
    curl_setopt($ch, CURLOPT_URL, $url);
    $data = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'data' => $data];
}

function doPost()
{
    $url = !empty($_POST['url']) ? $_POST['url'] : null;
    if (!$url)  throw new Exception('no url');

    $fields = !empty($_POST['fields']) ? $_POST['fields'] : null;
    if (!$fields)  throw new Exception('no fields');

    $fields = http_build_query($fields);

    $ch = prepareCurl();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
    //curl_setopt($ch, CURLOPT_POSTREDIR, 8);

    $data = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'data' => $data];
}

function doUnknown()
{
    throw new Exception('unknown command');
}
