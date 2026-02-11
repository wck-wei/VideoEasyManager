# VideoEasyManager

一个可在浏览器中上传、下载与播放媒体（视频/音频/图片）的示例工具。媒体文件保存在 Linux 主机目录，并通过 Docker 部署。

## 功能
- 浏览器上传媒体（视频/音频/图片）
- 媒体列表、在线播放/查看与下载
- 媒体文件存储在宿主机 Linux 目录（容器内挂载）
- 简单 Basic Auth 鉴权

## 本地运行（非 Docker）
```bash
npm install
npm start
```
默认访问：`http://localhost:3000`

## Docker 部署
1. 在 Linux 主机上准备目录，例如：
```bash
sudo mkdir -p /opt/videos
```
2. 启动服务：
```bash
docker compose up -d --build
```
3. 浏览器访问：`http://<服务器IP>:3000`

### 自定义视频目录
修改 `docker-compose.yml`：
```yaml
volumes:
  - /你的Linux目录:/data/videos
```

## 主要接口
- `GET /api/videos` 获取视频列表
- `POST /api/videos` 上传视频（表单字段 `file`）
- `GET /api/videos/:name` 播放视频（支持 Range）
- `GET /api/videos/:name/download` 下载视频
- `DELETE /api/videos/:name` 删除视频

## 鉴权配置
默认使用 Basic Auth。可通过环境变量设置：
```bash
AUTH_USER=你的用户名
AUTH_PASS=你的密码
```
若未设置，将使用默认账号密码。
