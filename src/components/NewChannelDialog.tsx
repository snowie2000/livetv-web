import { api } from "@/modules/axios.config"
import { AutoComplete, Checkbox, Form, Input, InputRef, Modal, Select, Space } from "antd"
import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "react-query"
import styles from "./NewChannelDialog.less"
import { BaseOptionType } from "antd/es/select"
import { defaultQueryClient } from "./ReactQueryClientProvider"

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
  Category: string
}

interface dlgProps {
  mode: "add" | "edit" | "view"
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
  const [categoryVal, setCategoryVal] = useState<string>("")
  const { data: parsers } = useQuery("parsers", () =>
    api.get("/plugins").then((res) => JSON.parse(res.data).map((p: string) => ({ label: p, value: p })))
  )
  const { data: CategoryList } = useQuery<BaseOptionType[]>("category", () =>
    api.get("/category").then((res) => (JSON.parse(res.data) ?? []).map((p: string) => ({ value: p })))
  )

  const filteredCategory = useMemo(() => {
    const value = categoryVal.trim()
    if (!value) return CategoryList
    return CategoryList?.filter((c: any) => c.value.includes(value)) ?? []
  }, [CategoryList, categoryVal])

  const readOnly = useMemo(() => props.mode === "view", [props.mode])

  function handleSubmit() {
    form?.validateFields().then((values) => {
      setBusy(true)
      props
        .onAdd({
          ...values,
          Proxy: values.Proxy && values.Proxy !== "0",
          TsProxy: values.Proxy === "2" ? customTsProxy : "",
          ProxyUrl: values.UseProxy ? values.ProxyUrl : "",
        })
        .then(() => {
          // update category list if a new category is added
          if (categoryVal && !CategoryList?.find((v) => v.value === categoryVal)) {
            defaultQueryClient.invalidateQueries("category")
          }
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
      setCategoryVal("")
      form?.resetFields()
      form?.setFieldValue("Parser", "http")
      if (props.mode === "edit" || props.mode === "view") {
        form?.setFieldsValue({
          ...props.channel,
          Proxy: props.channel!.Proxy ? (props.channel!.TsProxy ? "2" : "1") : "0",
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
      onOk={readOnly ? props.onCancel : handleSubmit}
      cancelButtonProps={{ style: { visibility: readOnly ? "hidden" : "visible" } }}
      destroyOnClose={true}
      maskClosable={readOnly}
      confirmLoading={busy}
      className={styles.NewChannelDialog}
      title={props.mode === "add" ? "New Channel" : readOnly ? "View Channel" : "Edit Channel"}
    >
      <div style={{ marginTop: 20 }}>
        <Form labelCol={{ span: 6 }} form={form} onValuesChange={handleValuesChange} initialValues={{ Proxy: "0" }}>
          <fieldset disabled={readOnly}>
            <Form.Item name="ID" hidden />
            <Form.Item label="Channel Name" name="Name" rules={[{ required: true }]}>
              <Input placeholder="Channel name" allowClear readOnly={readOnly} />
            </Form.Item>
            <Form.Item label="Live URL" name="URL" rules={[{ required: true }]}>
              <Input placeholder="URL" allowClear readOnly={readOnly} />
            </Form.Item>
            <Form.Item label="Parser" name="Parser" rules={[{ required: true }]}>
              <Select placeholder="URL" options={parsers} disabled={readOnly} />
            </Form.Item>
            <Form.Item label="Category" name="Category">
              <AutoComplete
                placeholder="Select or type new category names"
                options={filteredCategory}
                onSearch={setCategoryVal}
                disabled={readOnly}
              />
            </Form.Item>
            <Form.Item label="Proxy stream" name="Proxy">
              <Select optionLabelProp="title" disabled={readOnly}>
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
                      onDoubleClick={() => {
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
              <Input placeholder="socks5://user:password@example.com:443" readOnly={readOnly} />
            </Form.Item>
          </fieldset>
        </Form>
      </div>
    </Modal>
  )
}
