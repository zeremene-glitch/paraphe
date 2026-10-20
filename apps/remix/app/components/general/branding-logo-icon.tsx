import type { SVGAttributes } from 'react';

export type LogoProps = SVGAttributes<SVGSVGElement>;

/** Paraphe mark: a lowercase "p" whose stem ends in the pen swash. */
export const BrandingLogoIcon = ({ ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
      <g fill="currentColor">
        <path
          transform="translate(105.8 -78.9) scale(0.1407)"
          d="M186 3304V1192H542V1446H563Q591 1390 642.0 1326.5Q693 1263 780.0 1217.5Q867 1172 1002 1172Q1180 1172 1323.5 1262.5Q1467 1353 1551.5 1529.5Q1636 1706 1636 1962Q1636 2215 1553.0 2392.0Q1470 2569 1327.0 2662.0Q1184 2755 1003 2755Q871 2755 784.0 2711.0Q697 2667 644.5 2604.5Q592 2542 563 2486H548V3304ZM541 1960Q541 2109 583.5 2221.0Q626 2333 706.5 2395.5Q787 2458 902 2458Q1022 2458 1103.0 2393.5Q1184 2329 1225.5 2216.5Q1267 2104 1267 1960Q1267 1817 1226.0 1706.0Q1185 1595 1104.0 1532.0Q1023 1469 902 1469Q786 1469 705.0 1530.0Q624 1591 582.5 1701.0Q541 1811 541 1960Z"
        />
        <path d="M 134 360 C 172 420, 380 392, 440 272 C 380 414, 172 450, 134 360 Z" />
      </g>
    </svg>
  );
};
