// 演示用云监工摄像头数据。
// online: true 在线 / false 离线；configStatus: configured 已配置 / pending 待配置。
// sn 为摄像头设备序列号（已配置时存在）。
export const initialCloudCameras = [
  { id: 'CAM-01', code: 'CAM-01', location: '斗姆元君大殿 · 正门', online: true, configStatus: 'configured', sn: 'TF88291001' },
  { id: 'CAM-02', code: 'CAM-02', location: '斗姆元君大殿 · 殿内', online: true, configStatus: 'configured', sn: 'TF88291002' },
  { id: 'CAM-03', code: 'CAM-03', location: '三清殿 · 神像区', online: true, configStatus: 'configured', sn: 'TF88291003' },
  { id: 'CAM-04', code: 'CAM-04', location: '灵官殿 · 东壁', online: true, configStatus: 'configured', sn: 'TF88291004' },
  { id: 'CAM-05', code: 'CAM-05', location: '经堂 · 弘生道', online: false, configStatus: 'pending', sn: '' },
  { id: 'CAM-06', code: 'CAM-06', location: '物料收发区', online: true, configStatus: 'configured', sn: 'TF88291006' },
]

// 摄像头位置下拉选项（与 mock 数据中的位置保持一致）。
export const cameraLocationOptions = [
  '斗姆元君大殿 · 正门',
  '斗姆元君大殿 · 殿内',
  '三清殿 · 神像区',
  '灵官殿 · 东壁',
  '经堂 · 弘生道',
  '物料收发区',
]
