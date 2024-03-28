import { api } from "@/modules/axios.config"
import { Checkbox, Form, Input, Modal, Select } from "antd"
import { useEffect, useState } from "react"
import { useQuery } from "react-query"

export interface ChannelInfo {
  No: number
  ID: string
  URL: string
  Name: string
  Parser: string
  M3U8: string
  Proxy: boolean
  LastUpdate: string
  Status: number
  Message: string
}

interface dlgProps {
  mode: "add" | "edit"
  visible: boolean
  channel?: ChannelInfo
  onAdd: (ci: ChannelInfo) => Promise<unknown>
  onCancel: () => void
}

export default function NewChannelDialog(props: dlgProps) {
  const [form] = Form.useForm()
  const [busy, setBusy] = useState(false)

  const { data: parsers } = useQuery("parsers", () =>
    api.get("/plugins").then((res) => JSON.parse(res.data).map((p: string) => ({ label: p, value: p })))
  )

  function handleSubmit() {
    form?.validateFields().then((values) => {
      setBusy(true)
      props.onAdd(values).finally(() => {
        setBusy(false)
      })
    })
  }

  // reset form on show
  useEffect(() => {
    if (props.visible) {
      form?.resetFields()
      form?.setFieldValue("Parser", "youtube")
      if (props.mode === "edit") {
        form?.setFieldsValue(props.channel)
      }
    }
  }, [props.visible])

  return (
    <Modal
      open={props.visible}
      onCancel={props.onCancel}
      onOk={handleSubmit}
      destroyOnClose={true}
      maskClosable={false}
      confirmLoading={busy}
      title={props.mode === "add" ? "New Channel" : "Edit Channel"}
    >
      <div style={{ marginTop: 20 }}>
        <Form labelCol={{ span: 6 }} form={form}>
          <Form.Item name="ID" hidden />
          <Form.Item label="Channel Name" name="Name" rules={[{ required: true }]}>
            <Input placeholder="Channel name" allowClear />
          </Form.Item>
          <Form.Item label="Live URL" name="URL" rules={[{ required: true }]}>
            <Input placeholder="URL" allowClear />
          </Form.Item>
          <Form.Item label="Parser" name="Parser" rules={[{ required: true }]}>
            <Select placeholder="URL" options={parsers} />
          </Form.Item>
          <Form.Item label="Proxy stream" name="Proxy" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
