# uptime-prometheus-exporter
Exporter of uptime status for Prometheus


# Instalation on CentOS 7

## Security (Firewall + SELinux)
```
firewall-cmd --add-port=19088/tcp --permanent
firewall-cmd  --reload
semanage port -a -t http_port_t -p tcp 19088
```

## Docker

```
docker run --name uptime-prometheus-exporter --log-driver=journald -p 127.0.0.1:8080:8080 -e URL='{"port": 8080, "targets": [{"url": "http://storyous.com", "pattern": "/storyous/i"},{"url": "https://login.storyous.com"}]}' -d <image_id>
```
