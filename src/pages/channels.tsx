import { useCallback, useEffect, useMemo, useState } from "react"
import styles from "./channels.less"
import { Button, Input, Modal, Select, Space, Table, Tooltip, message } from "antd"
import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MenuOutlined,
  QuestionCircleFilled,
  SafetyOutlined,
  SettingOutlined,
  WarningFilled,
} from "@ant-design/icons"
import classNames from "classnames"
import { ColumnsType } from "antd/es/table"
import NewChannelDialog, { ChannelInfo } from "@/components/NewChannelDialog"
import { useMutation, useQuery } from "react-query"
import { api } from "@/modules/axios.config"
import { defaultQueryClient } from "@/components/ReactQueryClientProvider"
import { AxiosResponse } from "axios"
import Option from "./option"

const _columns: ColumnsType<any> = [
  {
    title: "#",
    width: 60,
    dataIndex: "No",
  },
  {
    title: "Name",
    width: 150,
    dataIndex: "Name",
  },
  {
    title: "Live",
    dataIndex: "URL",
    render(value) {
      return <span className={styles.liveUrl}>{value}</span>
    },
  },
  {
    title: "M3U8",
    dataIndex: "M3U8",
    render(value, record: ChannelInfo, index) {
      const Icons = [
        <QuestionCircleFilled style={{ color: "#CCC" }} />,
        <CheckCircleFilled style={{ color: "#52c41a" }} />,
        <WarningFilled style={{ color: "#faad14" }} />,
        <CloseCircleFilled style={{ color: "#ff4d4f" }} />,
        <WarningFilled style={{ color: "#faad14" }} />,
      ]

      return (
        <Space>
          <Tooltip
            title={
              <>
                {record.Message}
                <br />
                {record.LastUpdate}
              </>
            }
          >
            {Icons[record.Status]}
          </Tooltip>
          <span className={styles.m3u8}>{value}</span>
        </Space>
      )
    },
  },
  {
    title: "Proxy",
    width: 80,
    render(dom, rec) {
      return (
        <Space>
          {rec.Proxy && <CheckOutlined title="Stream proxied" />}
          {!!rec.ProxyUrl && <SafetyOutlined title="Connect via proxy" />}
        </Space>
      )
    },
  },
  {
    title: <MenuOutlined />,
    width: 80,
  },
]

const playlistTypes = [
  {
    label: "M3U",
    value: "lives.m3u",
  },
  {
    label: "TXT",
    value: "lives.txt",
  },
]

function transformReq(ci: ChannelInfo) {
  return {
    id: ci.ID,
    url: ci.URL,
    name: ci.Name,
    proxy: ci.Proxy,
    parser: ci.Parser,
    proxyurl: ci.ProxyUrl,
    tsproxy: ci.TsProxy,
    category: ci.Category,
  }
}

export default function Channels() {
  const [dialogShow, setDialogShow] = useState(false)
  const [optionShow, setOptionShow] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add")
  const [playlistUrl, setPlayListUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [playlistType, setPlaylistType] = useState("lives.m3u")
  const [editingChannel, setEditingChannel] = useState<ChannelInfo>()

  useEffect(() => {
    document.title = "Channel List - LiveTV!"
  }, [])

  const doAddChannel = useMutation(
    (ci: ChannelInfo) =>
      api.post("/newchannel", transformReq(ci), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    {
      onSuccess() {
        defaultQueryClient.invalidateQueries("channelList")
      },
      onError(error: AxiosResponse) {
        message.error(error?.data ?? "Unknown error")
      },
    }
  )

  const doDeleteChannel = useMutation((id: string) => api.get("/delchannel", { params: { id } }), {
    onSuccess() {
      defaultQueryClient.invalidateQueries("channelList")
    },
    onError(error: AxiosResponse) {
      message.error(error?.data ?? "Unknown error")
    },
  })

  const doUpdateChannel = useMutation(
    (ci: ChannelInfo) =>
      api.post("/updatechannel", transformReq(ci), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    {
      onSuccess() {
        defaultQueryClient.invalidateQueries("channelList")
      },
      onError(error: AxiosResponse) {
        message.error(error?.data ?? "Unknown error")
      },
    }
  )

  const { data: channels, isLoading: chLoading } = useQuery(
    "channelList",
    () =>
      api
        .get("/channels", {
          responseType: "json",
        })
        .then((res) => {
          const list = JSON.parse(res.data) as ChannelInfo[]
          if (Array.isArray(list) && list.length) {
            list.forEach((ch, idx) => {
              ch.Parser = ch.Parser || "http"
              ch.No = idx
            })
            setPlayListUrl(list.shift()!.M3U8)
          }
          return list ?? []
        }),
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  )

  const displayPlaylistUrl = useMemo(() => {
    return playlistUrl.replace("lives.m3u", playlistType)
  }, [playlistType, playlistUrl])

  function handleAddChannel() {
    setDialogMode("add")
    setDialogShow(true)
  }

  function handleFinish(ci: ChannelInfo) {
    setDialogShow(false)
    return dialogMode === "add" ? doAddChannel.mutateAsync(ci) : doUpdateChannel.mutateAsync(ci)
  }

  // copy m3u8 playlist to clipboard
  function handleCopy() {
    navigator.clipboard
      .writeText(displayPlaylistUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 3000)
      })
      .catch((err) => {
        console.error("Failed to copy text:", err)
      })
  }

  const handleEditChannel = useCallback((ch: ChannelInfo) => {
    setEditingChannel(ch)
    setDialogMode("edit")
    setDialogShow(true)
  }, [])

  const handleViewChannel = useCallback((ch: ChannelInfo) => {
    setEditingChannel(ch)
    setDialogMode("view")
    setDialogShow(true)
  }, [])

  const handleDeleteChannel = useCallback((ch: ChannelInfo) => {
    Modal.confirm({
      title: "Delete channel",
      content: 'Do you want to delete the channel "' + ch.Name + '" permanently?',
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk() {
        doDeleteChannel.mutate(ch.ID)
      },
    })
  }, [])

  const columns = useMemo(() => {
    _columns[_columns.length - 1].render = (dom, entity) => {
      return entity.Virtual ? (
        <EyeOutlined onClick={() => handleViewChannel(entity)} />
      ) : (
        <Space>
          <EditOutlined onClick={() => handleEditChannel(entity)} />
          <DeleteOutlined onClick={() => handleDeleteChannel(entity)} />
        </Space>
      )
    }
    return _columns
  }, [handleEditChannel, handleDeleteChannel])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <Space>
          LiveTV! <small>IPTV feeds on your hand</small>
          <SettingOutlined style={{ fontSize: "16px" }} onClick={() => setOptionShow(true)} />
        </Space>
      </h1>
      <div className={styles.toolbar}>
        <div className={classNames([styles.playlist, "flex"])}>
          <span>Playlist:&nbsp;&nbsp;</span>
          <Space.Compact style={{ flex: "1 1 99%" }}>
            <Select defaultValue="lives.m3u" value={playlistType} onChange={setPlaylistType} options={playlistTypes} />
            <Input value={displayPlaylistUrl} readOnly />
            <Tooltip title={copied ? "Copied" : "Click to copy"}>
              <Button icon={<CopyOutlined />} onClick={handleCopy} />
            </Tooltip>
          </Space.Compact>
        </div>
        <div>
          <Button type="primary" onClick={handleAddChannel} style={{ marginLeft: "5px" }}>
            New channel
          </Button>
        </div>
      </div>
      <Table
        size="middle"
        locale={{
          emptyText: <div style={{ textAlign: "center" }}>No channels yet</div>,
        }}
        scroll={{ x: "100%" }}
        rowKey={"ID"}
        dataSource={channels ?? []}
        loading={chLoading}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: [10, 20, 50, 100],
          showSizeChanger: true,
        }}
      />
      {/** dialogs */}
      <NewChannelDialog
        mode={dialogMode}
        visible={dialogShow}
        channel={editingChannel}
        onAdd={handleFinish}
        onCancel={() => setDialogShow(false)}
      />
      <Option visible={optionShow} onClose={() => setOptionShow(false)} />
    </div>
  )
}
