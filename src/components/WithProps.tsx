/** 将组件为子组件添加描述功能，并透传所有属性 */
export default function WithProps<T>(props: T & { content: (props: T) => React.ReactNode }) {
  const { content, ...rest } = props;
  return <>{content(rest as T)}</>;
}
