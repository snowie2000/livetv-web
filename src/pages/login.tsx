import { Button, Card, Form, Input, message } from "antd"
import styles from "./login.less"
import classNames from "classnames"
import { api } from "@/modules/axios.config"
import { useMutation, useQuery } from "react-query"
import { history } from "umi"
import { defaultQueryClient } from "@/components/ReactQueryClientProvider"
import { AxiosResponse } from "axios"
import { useEffect } from "react"

interface Credential {
    password: string
}

export default function Login() {
    const { data: crsfToken } = useQuery('crsf', () => api.get("/crsf").then(res => res.data))

    useEffect(()=>{
        document.title = "Login - LiveTV!"
      }, [])

    const doSubmit = useMutation((credential: Credential) => {
        return api.post("/login", {
            ...credential,
            type: "ajax",
            crsf: crsfToken,
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(res => res.data)
    }, {
        onSuccess() {
            history.push("/channels")
        },
        onError(error: AxiosResponse, variables, context) {
            defaultQueryClient.invalidateQueries("crsf")
            message.error(error?.data ?? "Unknown error")
        },
    })

    function handleFormSubmit(values: Credential) {
        doSubmit.mutate(values)
    }

    return <div className={classNames(["flex", "fullpage", styles.centered, styles.bg])}>
        <div className={styles.login}>
            <Card className={styles.loginCard} bordered={false}>
                <h2>LiveTV</h2>
                <Form onFinish={handleFormSubmit}>
                    <Form.Item name="password" rules={[{ required: true, message: "Please input your password" }]}>
                        <Input placeholder="Password" allowClear type="password" />
                    </Form.Item>
                    <div className={styles.stretch}>
                        <Button loading={doSubmit.isLoading} type="primary" size="middle" htmlType="submit">Login</Button>
                    </div>
                </Form>
            </Card>
        </div>
    </div>
}
