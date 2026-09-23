# Porto Esfirras

Site, catálogo e painel de pedidos da Porto Esfirras.

## Estado de publicação

O Site permanece privado. Pedidos reais começam desligados. Na prévia, apenas o administrador autorizado pode registrar pedidos de teste. O cardápio inicial veio de capturas de tela e precisa ser conferido no painel antes de abrir as vendas.

## Operação

- `/`: cardápio e finalização do pedido. Produtos e preços são carregados do banco; valores de pedidos são recalculados no servidor.
- `/admin`: pedidos, valores recebidos, edição do cardápio, bairros/taxas de entrega e ativação dos meios de pagamento. O acesso aos dados e às alterações depende de `ADMIN_EMAIL` e da identidade autenticada do Site.
- `ordersEnabled` desligado: pedidos de teste apenas para o administrador, sem pagamento nem aviso à cozinha.
- Retirada e pagamento na retirada podem ser habilitados após conferência do cardápio. Para entregas, cadastrar bairros e taxas; entrega real requer Pix configurado.
- Pix usa Mercado Pago Orders API, com valor total calculado no servidor, chave de idempotência por pedido, QR Code e cópia/cola. O webhook `/api/webhooks/mercado-pago?type=order&data.id=...` verifica assinatura, consulta a ordem no provedor e registra exatamente o valor recebido. Só confirma pagamento integral quando a ordem está processada e o valor recebido cobre o total.

## Configuração para produção

Definir no ambiente do Site: `ADMIN_EMAIL`, `MERCADO_PAGO_ACCESS_TOKEN` (segredo) e `MERCADO_PAGO_WEBHOOK_SECRET` (segredo). Registrar a URL pública do webhook na aplicação Mercado Pago com tópico `order`. Testar com credenciais de teste e uma compra de ponta a ponta antes de usar credenciais de produção. A prévia privada impede chamadas externas de webhook; só publicar para clientes após validar catálogo, entrega e pagamento.

Os segredos não devem ser incluídos no repositório. Cartão ainda depende de integração e testes específicos; não está oferecido no checkout.

## Desenvolvimento

`pnpm install`, `pnpm db:generate` quando houver alterações de esquema, `pnpm build`.
Migrations em `drizzle/` são aplicadas na publicação do Site e nunca devem ter versões já aplicadas reescritas.
