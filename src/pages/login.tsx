import { Button, Card, Form, Input, Space, message } from "antd"
import styles from "./login.less"
import classNames from "classnames"
import { api } from "@/modules/axios.config"
import { useMutation, useQuery } from "react-query"
import { history } from "umi"
import { defaultQueryClient } from "@/components/ReactQueryClientProvider"
import { AxiosResponse } from "axios"
import { useEffect, useState } from "react"

interface Credential {
  password: string
}

interface CaptchaInfo {
  data: string //img in base64
  captcha_id: string
}

function WithProps<T>(props: T & { content: (props: T) => React.ReactNode }) {
  const { content, ...rest } = props
  return <>{content(rest as T)}</>
}

export default function Login() {
  const [form] = Form.useForm()
  const [captchaInfo, setCaptchaInfo] = useState<CaptchaInfo>()
  const [crsfToken, setCSRFToken] = useState<string>("")

  const loadOTP = () => {
    api
      .get("/captcha")
      .then((res) => JSON.parse(res.data) as CaptchaInfo)
      .then(setCaptchaInfo)
    api
      .get("/crsf")
      .then((res) => res.data)
      .then(setCSRFToken)
  }

  useEffect(() => {
    document.title = "Login - LiveTV!"
    loadOTP()
  }, [])

  useEffect(() => {
    if (captchaInfo) form.setFieldsValue({ captcha_id: captchaInfo.captcha_id })
  }, [captchaInfo])

  const doSubmit = useMutation(
    (credential: Credential) => {
      return api
        .post(
          "/login",
          {
            ...credential,
            type: "ajax",
            crsf: crsfToken,
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )
        .then((res) => res.data)
    },
    {
      onSuccess() {
        history.push("/channels")
      },
      onError(error: AxiosResponse, variables, context) {
        form.setFieldValue("answer", "")
        loadOTP()
        message.error(error?.data ?? "Unknown error")
      },
    }
  )

  function handleFormSubmit(values: Credential) {
    doSubmit.mutate(values)
  }

  return (
    <div className={classNames(["flex", "fullpage", styles.centered, styles.bg])}>
      <div className={styles.login}>
        <Card className={styles.loginCard} bordered={false}>
          <h2>LiveTV</h2>
          <Form onFinish={handleFormSubmit} form={form} spellCheck={false} initialValues={{ answer: "" }}>
            <Form.Item name="password" rules={[{ required: true, message: "Please input your password" }]}>
              <Input placeholder="Password" allowClear type="password" />
            </Form.Item>
            <Form.Item name="answer" rules={[{ required: true, message: "Please enter the captcha" }]}>
              <WithProps
                content={(props: any) => (
                  <div style={{ position: "relative" }}>
                    <img src={captchaInfo?.data} className={styles.captcha} alt="captcha image" />
                    <Input className={styles.answer} maxLength={4} {...props} />
                    <div className={styles.btnSubmit}>
                      <Button loading={doSubmit.isLoading} type="primary" size="middle" htmlType="submit">
                        Login
                      </Button>
                    </div>
                  </div>
                )}
              />
            </Form.Item>
            <Form.Item name="captcha_id" hidden />
          </Form>
        </Card>
      </div>
    </div>
  )
}
