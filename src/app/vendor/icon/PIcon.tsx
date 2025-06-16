import { allIconMap } from "./all-icon";


const iconMap = allIconMap;

/** 當找不到目標 icon 時就會自動換成這個 icon */
const defaultIcon = 'fa-asterisk';

type IconProp = {
  name?: keyof typeof iconMap;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

function NotFoundIcon(props: IconProp) {
  const { className, style, size = 16 } = props;
  const MIcon = iconMap[defaultIcon]
  return <MIcon className={className} style={style} size={size}>Icon Not Found</MIcon>;
}

export function PIcon(props: IconProp) {
  const { name, className, style, size = 16 } = props;
  if (!name || !(name in iconMap)) {
    return <NotFoundIcon className={className} style={style} size={size} />;
  }
  const iconName = name;
  const IconComponent = iconMap[iconName];
  return <IconComponent className={className} style={style} size={size} />;
}

export default PIcon;