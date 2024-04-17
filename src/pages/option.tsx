import React, { useEffect, useState } from "react"
import styles from "./option.less"
import { Button, Form, Input, Modal, Tabs, TabsProps, Tooltip, message } from "antd"
import axios from "axios"
import { useMutation, useQuery } from "react-query"
import { api } from "@/modules/axios.config"
import { history } from "umi"
import { defaultQueryClient } from "@/components/ReactQueryClientProvider"
import { BulbOutlined, ThunderboltOutlined } from "@ant-design/icons"

interface optProps {
  visible: boolean
  onClose: () => void
}

export default function Option(props: optProps) {
  const [cfgForm] = Form.useForm()
  const [pwdForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState("config")

  function handleAutoFillHost() {
    cfgForm.setFieldValue("baseurl", window.location.origin)
  }

  function handleRandomizeSecret() {
    const secret = Math.random().toString(36).substring(2)
    cfgForm.setFieldValue("secret", secret)
  }

  const ConfigMgr = () => (
    <Form labelCol={{ span: 6 }} form={cfgForm}>
      <Form.Item name="cmd" label="yt-dlp Cmd" rules={[{ required: true }]}>
        <Input placeholder="yt-dlp" />
      </Form.Item>
      <Form.Item name="args" label="yt-dlp Args" rules={[{ required: true }]}>
        <Input placeholder="--extractor-args youtube:skip=dash -f b -g {url}" />
      </Form.Item>
      <Form.Item name="baseurl" label="BaseUrl" rules={[{ required: true }]}>
        <Input
          placeholder={window.location.origin}
          suffix={
            <Tooltip title="Autofill with current site">
              <ThunderboltOutlined onClick={handleAutoFillHost} />
            </Tooltip>
          }
        />
      </Form.Item>
      <Form.Item name="proxyurl" label="ProxyUrl">
        <Input
          placeholder="leave empty to use baseUrl as proxy"
        />
      </Form.Item>
      <Form.Item name="secret" label="Server secret">
        <Input
          suffix={
            <Tooltip title="Randomize">
              <BulbOutlined onClick={handleRandomizeSecret} />
            </Tooltip>
          }
        />
      </Form.Item>
      <Form.Item name="apikey" label="Data API">
        <Input />
      </Form.Item>
    </Form>
  )

  const PwdMgr = () => (
    <Form labelCol={{ span: 7 }} form={pwdForm}>
      <Form.Item name="password" label="New Password" rules={[{ required: true, message: "Input your password" }]}>
        <Input type="password" />
      </Form.Item>
      <Form.Item name="password2" label="Repeat Password" rules={[{ required: true, message: "Repeat your password" }]}>
        <Input type="password" />
      </Form.Item>
    </Form>
  )

  const About = () => (
    <div>
      <div>
        <a href="https://github.com/zjyl1994/livetv">LiveTV!</a> by <a href="https://github.com/zjyl1994">zjyl1994.</a>
      </div>
      <div>
        Forked by <a href="https://github.com/snowie2000">snowie2000</a>
      </div>
      <div>
        Made with <span style={{ color: "#e25555" }}>♥</span> in Kwangtung.
      </div>
      <div>
        <a href="/log" target="_blank">
          View log
        </a>
        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<a onClick={() => doLogout.mutate()}>Log out</a>
      </div>
    </div>
  )

  const { data: cfgData } = useQuery("live-config", () => api.get("/getconfig").then((res) => JSON.parse(res.data)), {
    enabled: props.visible,
  })

  useEffect(() => {
    if (props.visible) {
      if (cfgData) {
        cfgForm.setFieldsValue(cfgData)
      }
    }
  }, [cfgData, props.visible])

  useEffect(() => {
    if (props.visible) {
      setActiveTab("config")
    }
  }, [props.visible])

  const doUpdateConfig = useMutation(
    (values) =>
      api.post("/updconfig", values, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    {
      onSuccess() {
        defaultQueryClient.invalidateQueries("live-config")
      },
    }
  )

  const doChangePassword = useMutation((values) =>
    api.post("/changepwd", values, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  )

  const doLogout = useMutation(() => api.get("/logout"), {
    onSuccess() {
      function deleteCookie(cookieName: string) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      }

      deleteCookie("mysession")
      history.replace("/login")
    },
  })

  function handleOk() {
    switch (activeTab) {
      case "config": {
        cfgForm
          .validateFields()
          .then(doUpdateConfig.mutateAsync)
          .then(() => props.onClose())
        break
      }
      case "password": {
        pwdForm
          .validateFields()
          .then((values) => {
            if (values.password !== values.password2) {
              message.warning("Passwords do not match")
              return Promise.reject()
            } else {
              return doChangePassword.mutateAsync(values)
            }
          })
          .then(() => {
            doLogout.mutate()
            props.onClose()
          })
        break
      }
      case "about": {
        props.onClose()
        break
      }
    }
  }

  const tabs: TabsProps["items"] = [
    {
      label: "Config",
      key: "config",
      children: <ConfigMgr />,
    },
    {
      label: "Password",
      key: "password",
      children: <PwdMgr />,
    },
    {
      label: "About",
      key: "about",
      children: <About />,
    },
  ]

  return (
    <Modal title="Options" open={props.visible} onCancel={props.onClose} onOk={handleOk} destroyOnClose={true}>
      <Tabs items={tabs} defaultActiveKey="config" activeKey={activeTab} onChange={setActiveTab} />
    </Modal>
  )
}
