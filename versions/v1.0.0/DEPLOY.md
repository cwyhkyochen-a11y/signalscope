# 部署配置

## 服务器
- IP: 43.163.227.232 (腾讯云)
- SSH: `ssh -i ~/.openclaw/workspace/yoyo_use.pem root@43.163.227.232`
- 部署目录: /opt/signalscope/

## Caddy
```
handle /signalscope* {
    uri strip_prefix /signalscope
    reverse_proxy 127.0.0.1:3020
}
```

## PM2
- 进程名: signalscope
- 端口: 3020
- 入口: server/index.js

## 部署步骤
```bash
# 1. 同步代码
rsync -avz --exclude='node_modules' --exclude='server/data' \
  -e "ssh -i ~/.openclaw/workspace/yoyo_use.pem" \
  . root@43.163.227.232:/opt/signalscope/

# 2. 安装依赖 + 构建
ssh -i ~/.openclaw/workspace/yoyo_use.pem root@43.163.227.232 \
  "cd /opt/signalscope && npm install && npx vite build"

# 3. 重启
ssh -i ~/.openclaw/workspace/yoyo_use.pem root@43.163.227.232 \
  "pm2 restart signalscope"
```

## 账号
- admin / Admin@2024
