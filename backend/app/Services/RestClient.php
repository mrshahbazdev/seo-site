<?php

namespace App\Services;

class RestClientException extends \Exception
{
    protected $http_code;

    public function __construct($message, $http_code = 0, $code = 0, ?\Exception $previous = null)
    {
        $this->http_code = $http_code;
        parent::__construct($message, $code, $previous);
    }

    public function getHttpCode()
    {
        return $this->http_code;
    }

    public function __toString(): string
    {
        return __CLASS__ . ": [{$this->code}]: {$this->message} (HTTP status code: {$this->http_code})\n";
    }
}

class RestClient
{
    public $host;
    public $port;
    public $scheme;
    public $token;
    public $login;
    public $password;
    public $last_request;

    public function __construct($url, $token = null, $login = null, $password = null)
    {
        $parsed_url = parse_url($url);
        $this->scheme = isset($parsed_url['scheme']) ? $parsed_url['scheme'] : 'https';
        $this->host = isset($parsed_url['host']) ? $parsed_url['host'] : $parsed_url['path'];
        $this->port = isset($parsed_url['port']) ? $parsed_url['port'] : null;
        $this->token = $token;
        $this->login = $login;
        $this->password = $password;
    }

    public function request($path, $method, $data = array())
    {
        $this->last_request = array(
            'path' => $path,
            'method' => $method,
            'data' => $data
        );

        if ($this->scheme == "https") {
            $url = "https://{$this->host}";
            if (!is_null($this->port)) {
                $url .= ":{$this->port}";
            }
        } else {
            $url = "http://{$this->host}";
            if (!is_null($this->port)) {
                $url .= ":{$this->port}";
            }
        }

        $url .= $path;

        $curl = curl_init();
        $headers = array('Content-Type: application/json');

        if ($this->token) {
            $headers[] = "Authorization: {$this->token}";
        } else {
            $headers[] = "Authorization: Basic " . base64_encode("{$this->login}:{$this->password}");
        }

        $options = array(
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers
        );

        if (!empty($data)) {
            $options[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($curl, $options);

        $response = curl_exec($curl);
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $errno = curl_errno($curl);
        $error = curl_error($curl);

        curl_close($curl);

        if ($errno) {
            throw new RestClientException($error, $http_code);
        }

        $decoded = json_decode($response, true);
        if ($decoded === null) {
            throw new RestClientException("Invalid JSON response", $http_code);
        }

        // DataForSEO specific error handling might go here, but usually they return 200 with status fields

        return $decoded;
    }

    public function get($path)
    {
        return $this->request($path, 'GET');
    }

    public function post($path, $data)
    {
        return $this->request($path, 'POST', $data);
    }
}
