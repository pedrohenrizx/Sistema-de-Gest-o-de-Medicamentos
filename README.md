# Sistema de Gestão de Medicamentos

Um sistema web completo, responsivo e gratuito para controle de medicações, lembretes visuais, histórico de doses, alertas de interações medicamentosas e renovação de receitas. Desenvolvido com foco em acessibilidade, mobilidade e facilidade de uso.

## Funcionalidades Principais

- **Autenticação de Usuário**: Cadastro, login e perfil personalizado com tema claro/escuro.
- **Controle de Medicamentos**: Cadastro, remoção e visualização dos medicamentos do usuário.
- **Calendário de Administração**: Visualização das doses e registro de administração em interface amigável.
- **Histórico de Doses**: Registro visual de todas as administrações realizadas.
- **Relatórios de Aderência**: Geração e download de relatórios em PDF com gráficos de progresso.
- **Alertas de Interações Medicamentosas**: (Simulado) Indicação de possíveis interações.
- **Renovação de Receitas**: Notificações para renovação de receitas.
- **Navegação SPA**: Mudança de páginas instantânea usando JavaScript.
- **Responsivo e Mobile First**: Interface adaptada para qualquer tamanho de tela.
- **Totalmente Gratuito**: Sem planos pagos, sem assinaturas.

## Tecnologias Utilizadas

- **Frontend**: HTML, Tailwind CSS, DaisyUI, JavaScript (SPA), Chart.js
- **Backend**: Python (Flask), Flask-SQLAlchemy, Flask-Login, Flask-Session, SQLite
- **Relatórios**: ReportLab para PDFs

## Estrutura de Pastas

```
/
├── app.py
├── requirements.txt
├── README.md
├── static/
│   ├── index.html
│   └── js/
│       └── app.js
├── data/
│   └── database.sqlite
├── reports/
```

## Como Instalar e Executar

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd <nome-da-pasta>
   ```

2. **(Opcional) Crie um ambiente virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute o servidor**
   ```bash
   python app.py
   ```

5. **Acesse o sistema**
   - Abra o navegador em [http://localhost:3000](http://localhost:3000)

## Uso

- Cadastre-se e faça login.
- Navegue pelas páginas usando a barra superior.
- Adicione/remova medicamentos, registre doses, baixe relatórios.
- Altere o tema (claro/escuro) pelo botão na navbar.

## Observações

- Só usuários logados acessam as funcionalidades.
- Todos os dados são armazenados localmente em SQLite.
- O sistema é gratuito e sem restrições de uso.

## Licença

Uso livre para fins pessoais e acadêmicos.  
Desenvolvido para auxiliar no cuidado com sua saúde! ❤️
