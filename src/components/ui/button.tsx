'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * 시안의 버튼 4종을 그대로 옮긴다. 값을 임의로 바꾸지 않는다.
 *
 * - outline  : 대부분의 보조 액션(섹션 헤더, 상단 헤더). line2 테두리 + muted 글자,
 *              hover에서 primary-line/primary-text로.
 * - danger   : outline과 같지만 hover가 danger 계열(트랙 삭제, 주차 삭제).
 * - primary  : primary로 채운 주 액션(+ 토픽, + 활동 추가, 저장). 글자는 on-primary(흰색).
 *              시안에서 이 스타일은 화면당 1~2개뿐이다 — 뱃지에 쓰면 안 된다.
 * - dashed   : "추가" 자리를 나타내는 점선 버튼(+ 주차 추가, + 부원 배정).
 * - dangerOutline : 실선 danger 테두리(모달의 활동 삭제).
 */
const buttonVariants = cva('cursor-pointer whitespace-nowrap transition-colors disabled:cursor-default disabled:opacity-45', {
  variants: {
    variant: {
      outline:
        'text-xs border border-line2 rounded-[9px] px-3 py-2 text-muted hover:border-primary-line hover:text-primary-text',
      danger:
        'text-xs border border-line2 rounded-[9px] px-3 py-2 text-muted hover:border-danger-line hover:text-danger',
      primary: 'text-xs rounded-[9px] px-[14px] py-[9px] font-semibold text-on-primary bg-primary hover:opacity-90',
      dashed:
        'text-xs text-center rounded-[10px] border border-dashed border-dash p-2.5 text-muted hover:border-primary-line hover:text-primary-text',
      dangerOutline:
        'text-xs text-center border border-danger-line rounded-[9px] px-3 py-[9px] text-danger hover:bg-danger-soft',
    },
  },
  defaultVariants: {
    variant: 'outline',
  },
});

export function Button({
  variant,
  className,
  type = 'button',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

/** 버튼과 같은 모양이 필요한 링크(랜딩에서 보기 ↗). Base UI의 render prop으로 <a>를 그린다. */
export function ButtonLink({
  variant,
  className,
  ...props
}: VariantProps<typeof buttonVariants> & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <Button render={<a {...props} />} variant={variant} className={cn('inline-block', className)} />;
}
