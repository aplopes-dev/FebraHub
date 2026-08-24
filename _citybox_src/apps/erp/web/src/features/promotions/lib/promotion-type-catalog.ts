import type { ElementType } from "react";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import type { PromotionType } from "@/features/promotions/types/promotion";

export type PromotionTypeMeta = {
  type: PromotionType;
  title: string;
  icon: ElementType;
  /** Frase curta exibida no rodapé "PROMOÇÃO SELECIONADA". */
  tagline: string;
  /** Explica o que é a promoção (card da Etapa 1). */
  description: string;
  /** Explica como usar / quando faz sentido (card da Etapa 1). */
  howToUse: string;
};

export type PromotionTypeGroup = {
  id: string;
  title: string;
  description: string;
  types: PromotionTypeMeta[];
};

/**
 * Tipos agrupados por semelhança de comportamento, como pedido:
 * combos/escalonamento, por valor da compra, por quantidade e cupom.
 */
export const PROMOTION_TYPE_GROUPS: PromotionTypeGroup[] = [
  {
    id: "combos",
    title: "Combos e escalonamento",
    description: "Recompensam o cliente conforme a quantidade de itens iguais.",
    types: [
      {
        type: "buy_more_pay_less",
        title: "Leve mais, pague menos",
        icon: WidgetsOutlinedIcon,
        tagline: "Combo com preço fechado (ex.: leve 3, pague 2)",
        description:
          "Define um preço final fixo para um combo de itens elegíveis, como “Leve 3 e Pague 2”.",
        howToUse:
          "Escolha os produtos, a quantidade que ativa o combo e o valor total a pagar. Pode permitir aplicação múltipla na mesma venda.",
      },
      {
        type: "progressive_discount",
        title: "Desconto progressivo",
        icon: TrendingUpOutlinedIcon,
        tagline: "O preço unitário cai conforme a quantidade",
        description:
          "Cria faixas de quantidade em que o preço unitário diminui à medida que o cliente leva mais.",
        howToUse:
          "Defina faixas De/Até com o valor unitário de cada uma (ex.: de 3 a 5 unidades por um preço menor).",
      },
    ],
  },
  {
    id: "by_amount",
    title: "Por valor da compra",
    description: "Ativam quando o carrinho atinge um valor mínimo.",
    types: [
      {
        type: "discount_by_amount",
        title: "Desconto por valor",
        icon: LocalOfferOutlinedIcon,
        tagline: "Desconto ao atingir um valor mínimo de compra",
        description:
          "Concede um desconto quando o total do carrinho ultrapassa um valor definido.",
        howToUse:
          "Ideal para aumentar o ticket médio: ex.: compras acima de R$ 500 ganham um percentual de desconto.",
      },
      {
        type: "gift_by_amount",
        title: "Brinde por valor",
        icon: CardGiftcardOutlinedIcon,
        tagline: "Brinde ao atingir um valor mínimo de compra",
        description:
          "Entrega um produto como brinde quando o total do carrinho atinge o valor definido.",
        howToUse:
          "O brinde é adicionado automaticamente no PDV e baixado do estoque. Ex.: compras acima de R$ 700 ganham um item.",
      },
    ],
  },
  {
    id: "by_quantity",
    title: "Por quantidade de itens",
    description: "Estimulam a compra em volume.",
    types: [
      {
        type: "discount_by_quantity",
        title: "Desconto por quantidade",
        icon: PercentOutlinedIcon,
        tagline: "Desconto ao comprar uma quantidade mínima",
        description:
          "Aplica desconto quando o cliente atinge uma quantidade mínima de produtos no carrinho.",
        howToUse:
          "Comum em adegas e distribuidores: ex.: ao colocar 5 unidades, o cliente ganha 15% no pedido.",
      },
      {
        type: "gift_by_quantity",
        title: "Brinde por quantidade",
        icon: Inventory2OutlinedIcon,
        tagline: "Brinde ao atingir uma quantidade mínima",
        description:
          "Entrega um brinde quando o cliente compra uma quantidade mínima de itens.",
        howToUse:
          "Recompensa volume com produtos: ex.: ao comprar mais de 5 itens iguais, o cliente ganha um bônus.",
      },
    ],
  },
  {
    id: "coupon",
    title: "Cupom promocional",
    description: "Desconto liberado por um código.",
    types: [
      {
        type: "discount_coupon",
        title: "Cupom de desconto",
        icon: ConfirmationNumberOutlinedIcon,
        tagline: "Desconto liberado por código promocional",
        description:
          "Gera códigos de cupom que dão desconto no carrinho ou em itens específicos.",
        howToUse:
          "Ideal para campanhas no Instagram/WhatsApp. Disponível no PDV e no Totem; o sistema gera a planilha de códigos.",
      },
    ],
  },
];

const META_BY_TYPE: Record<PromotionType, PromotionTypeMeta> =
  PROMOTION_TYPE_GROUPS.reduce(
    (acc, group) => {
      for (const meta of group.types) {
        acc[meta.type] = meta;
      }
      return acc;
    },
    {} as Record<PromotionType, PromotionTypeMeta>,
  );

export function getPromotionTypeMeta(type: PromotionType): PromotionTypeMeta {
  return META_BY_TYPE[type];
}
