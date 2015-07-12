<?php
/**
 * doClear
 * doGet
 * doPost
 */

$c = !empty($_GET['c']) ? $_GET['c'] : null;
$commands = ['doClear', 'doGet', 'doPost'];
$func = in_array($c, $commands) ? $c : 'doUnknown';

header('Content-type:application/json; charset=utf-8');

try
{
    $sid = prepareSid();
    $result = $func($sid);
    http_response_code($result['code']);
    echo json_encode($result);
}
catch (Exception $e)
{
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit();

//----------------------------------------------------------------------------------------------------------------------

function prepareSid()
{
    $sid = !empty($_POST['sid']) ? $_POST['sid'] : null;
    $sid = preg_replace('@[^A-Za-z0-9]@', '', $sid);
    if (strlen($sid) != 32) throw new Exception('no sid');

    return $sid;
}

function getCookieFile($sid)
{
    return dirname(__FILE__).'/curl/cookies/'.$sid.'.txt';
}

function prepareCurl($sid)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_AUTOREFERER, true);
    //curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
    //curl_setopt($ch, CURLOPT_BUFFERSIZE, 64*1024);
    //curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:38.0) Gecko/20100101 Firefox/38.0');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Connection: keep-alive',
        //'Accept-Encoding: gzip, deflate'
        //'Cache-control: max-age=0'
        //'Referer: https://ihelper.mts.by/SelfCare/welcome.aspx'
    ]);
    $cookieFile = getCookieFile($sid);
    //curl_setopt($ch, CURLOPT_COOKIESESSION, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($ch, CURLOPT_VERBOSE, true);
    $logFile = dirname(__FILE__).'/curl/verbose.log';
    $lfp = fopen($logFile, 'a+');
    curl_setopt($ch, CURLOPT_STDERR, $lfp);

    $headerFile = dirname(__FILE__).'/curl/header.log';
    $hfp = fopen($headerFile, 'a+');
    curl_setopt($ch, CURLOPT_WRITEHEADER, $hfp);

    /*
    $bodyFile = dirname(__FILE__).'/curl/body.log.log';
    $bfp = fopen($bodyFile, 'w');
    curl_setopt($ch, CURLOPT_FILE, $bfp);
    */
    return $ch;
}

function curl_exec_utf8($ch)
{
    $data = curl_exec($ch);
    if (!is_string($data)) return $data;

    unset($charset);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

    /* 1: HTTP Content-Type: header */
    preg_match( '@([\w/+]+)(;\s*charset=(\S+))?@i', $content_type, $matches );
    if ( isset( $matches[3] ) )
        $charset = $matches[3];

    /* 2: <meta> element in the page */
    if (!isset($charset)) {
        preg_match( '@<meta\s+http-equiv="Content-Type"\s+content="([\w/]+)(;\s*charset=([^\s"]+))?@i', $data, $matches );
        if ( isset( $matches[3] ) )
            $charset = $matches[3];
    }

    /* 3: <xml> element in the page */
    if (!isset($charset)) {
        preg_match( '@<\?xml.+encoding="([^\s"]+)@si', $data, $matches );
        if ( isset( $matches[1] ) )
            $charset = $matches[1];
    }

    /* 4: PHP's heuristic detection */
    if (!isset($charset)) {
        $encoding = mb_detect_encoding($data);
        if ($encoding)
            $charset = $encoding;
    }

    /* 5: Default for HTML */
    if (!isset($charset)) {
        if (strstr($content_type, "text/html") === 0)
            $charset = "ISO 8859-1";
    }

    /* Convert it if it is anything but UTF-8 */
    /* You can change "UTF-8"  to "UTF-8//IGNORE" to
       ignore conversion errors and still output something reasonable */
    if (isset($charset) && strtoupper($charset) != "UTF-8")
        $data = iconv($charset, 'UTF-8', $data);

    return $data;
}


function doClear($sid)
{
    $cookieFile = getCookieFile($sid);
    if (file_exists($cookieFile)) unlink($cookieFile);

    return new stdClass();
}

function doGet($sid)
{
    $url = !empty($_POST['url']) ? $_POST['url'] : null;
    if (!$url)  throw new Exception('no url');

    $ch = prepareCurl($sid);
    curl_setopt($ch, CURLOPT_URL, $url);
    //$data = curl_exec($ch);
    $data = curl_exec_utf8($ch);

    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'data' => $data];
}

function doPost($sid)
{
    $url = !empty($_POST['url']) ? $_POST['url'] : null;
    if (!$url)  throw new Exception('no url');

    $fields = !empty($_POST['fields']) ? $_POST['fields'] : null;
    if (!$fields)  throw new Exception('no fields');

    $fields = http_build_query($fields);

    $ch = prepareCurl($sid);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
    //curl_setopt($ch, CURLOPT_POSTREDIR, 8);

    $data = curl_exec_utf8($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'data' => $data];
}

function doUnknown()
{
    throw new Exception('unknown command');
}
