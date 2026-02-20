from flask import Flask, jsonify, request
import os

app = Flask(__name__)

@app.route('/api/config_wifi', methods=['POST'])
def config_wifi():
    data = request.json
    ssid = data['ssid']
    password = data['password']
    # 存储到数据库或设备
    return jsonify({"status": "success"})

@app.route('/api/firmware', methods=['GET'])
def firmware():
    # 提供固件文件
    return send_file('/path/to/firmware.bin')

if __name__ == '__main__':
    app.run(debug=True)