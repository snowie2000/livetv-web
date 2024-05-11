import { api } from "@/modules/axios.config"
import { Checkbox, Form, Input, InputRef, Modal, Select, Space } from "antd"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"
import styles from "./NewChannelDialog.less"

export interface ChannelInfo {
  No: number
  ID: string
  URL: string
  Name: string
  Parser: string
  M3U8: string
  Proxy: boolean
  TsProxy: string
  ProxyUrl: string
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
  const [needProxy, setNeedProxy] = useState(false)
  const { Option } = Select
  const inputRef = useRef<InputRef>(null)
  const [customTsProxy, setCustomTsProxy] = useState("")
  const { data: parsers } = useQuery("parsers", () =>
    api.get("/plugins").then((res) => JSON.parse(res.data).map((p: string) => ({ label: p, value: p })))
  )

  function handleSubmit() {
    form?.validateFields().then((values) => {
      setBusy(true)
      props
        .onAdd({
          ...values,
          Proxy: values.Proxy !== "0",
          TsProxy: values.Proxy === "2" ? customTsProxy : "",
          ProxyUrl: values.UseProxy ? values.ProxyUrl : "",
        })
        .finally(() => {
          setBusy(false)
        })
    })
  }

  // reset form on show
  useEffect(() => {
    if (props.visible) {
      setNeedProxy(false)
      form?.resetFields()
      form?.setFieldValue("Parser", "youtube")
      if (props.mode === "edit") {
        form?.setFieldsValue({
          ...props.channel,
          Proxy: props.channel!.Proxy ? (props.channel!.TsProxy ? "2" :"1") : "0",
          UseProxy: !!props.channel!.ProxyUrl,
        })
        setNeedProxy(!!props.channel!.ProxyUrl)
        setCustomTsProxy(props.channel!.TsProxy)
      }
    }
  }, [props.visible])

  function handleValuesChange(_: any, { UseProxy }: any) {
    setNeedProxy(!!UseProxy)
  }

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
        <Form labelCol={{ span: 6 }} form={form} onValuesChange={handleValuesChange}>
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
          <Form.Item label="Proxy stream" name="Proxy">
            <Select optionLabelProp="title" defaultValue={"0"}>
              <Option value="0" title="No proxy">
                No proxy
              </Option>
              <Option value="1" title="Same as baseurl">
                Same as baseurl
              </Option>
              <Option value="2" title={"Custom: " + customTsProxy}>
                <div className={styles.TsProxySelector}>
                  <span>Custom:</span>
                  <Input
                    ref={inputRef}
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.focus()
                    }}
                    onDoubleClick={()=>{
                      inputRef.current?.select()
                    }}
                    placeholder="https://example.com"
                    value={customTsProxy}
                    onChange={(e) => setCustomTsProxy(e.target.value)}
                  />
                </div>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item label="Use Proxy" name="UseProxy" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item label="Proxy string" name="ProxyUrl" hidden={!needProxy}>
            <Input placeholder="socks5://user:password@example.com:443" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
