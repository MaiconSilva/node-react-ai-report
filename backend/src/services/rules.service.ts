import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';

@Injectable()
export class RulesService {
  private readonly RULES_FILENAME = 'business-rules.txt';
  private readonly DEFAULT_RULES = `# Contexto de Negocio - Sistema de Vendas

Este e um sistema de vendas com gestao de clientes, produtos e pedidos.

## Entidades Principais

CLIENTES: Cadastro de clientes com nome, email, cidade e estado.
- Estado e sempre codigo de 2 letras (CA, NY, TX, etc.)
- Email e unico no sistema
- ID do cliente e a coluna 'id', referenciada por orders.customer_id

PEDIDOS: Representam uma compra realizada por um cliente.
- ID do pedido e a coluna 'id', referenciada por order_items.order_id
- Ciclo de vida: pending -> processing -> completed (ou cancelled)
- Status "completed" significa pago e entregue
- Valor total fica em total_amount (pre-calculado)

ITENS_DE_PEDIDO: Produtos dentro de um pedido.
- ID do item e a coluna 'id'
- Cada item tem quantidade e preco unitario na epoca da compra
- Para calcular valor: quantity * unit_price
- order_id referencia orders.id
- product_id referencia products.id

PRODUTOS: Catalogo com categorias pre-definidas.
- ID do produto e a coluna 'id', referenciada por order_items.product_id
- Categorias: Electronics, Furniture, Office Supplies, Software, Apparel
- Estoque controlado em stock_quantity

## Regras Importantes

- Produtos com estoque < 10 sao considerados "estoque baixo"
- Pedidos cancelados nao entram em metricas de vendas
- Para analise de receita, prefira usar orders.total_amount
- Quando fizer JOIN de orders com customers, use: orders.customer_id = customers.id
- Quando fizer JOIN de order_items com orders, use: order_items.order_id = orders.id
- Quando fizer JOIN de order_items com products, use: order_items.product_id = products.id

## Dicas de SQL

- Use sempre TOP 100 (ou menos) para limitar resultados
- Para "top clientes", some total_amount dos pedidos ou calcule via order_items
- Para "vendas por categoria", JOIN order_items + products e agrupe por category
- Para "produtos sem estoque": WHERE stock_quantity = 0
`;

  constructor(private jsonStorage: JsonStorageService) {}

  async getRules(): Promise<string> {
    const content = await this.jsonStorage.readText(this.RULES_FILENAME);
    
    if (!content) {
      // Return default rules if file doesn't exist
      return this.DEFAULT_RULES;
    }
    
    return content;
  }

  async saveRules(content: string): Promise<void> {
    await this.jsonStorage.writeText(this.RULES_FILENAME, content);
    console.log(`Business rules saved to ${this.RULES_FILENAME}`);
  }

  async rulesExist(): Promise<boolean> {
    return this.jsonStorage.fileExists(this.RULES_FILENAME);
  }

  async initializeDefaultRules(): Promise<void> {
    if (!await this.rulesExist()) {
      await this.saveRules(this.DEFAULT_RULES);
      console.log(`Initialized default business rules in ${this.RULES_FILENAME}`);
    }
  }
}
