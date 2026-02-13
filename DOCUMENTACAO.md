# 📖 Documentação StudiaBot - Guia Completo

## 📋 Índice

1. [Introdução](#introdução)
2. [Começando (Primeiros Passos)](#começando-primeiros-passos)
3. [Comandos Disponíveis](#comandos-disponíveis)
4. [Sistema de XP e Níveis](#sistema-de-xp-e-níveis)
5. [Tabela de Ranks](#tabela-de-ranks)
6. [Sistema de Sessão de Estudo](#sistema-de-sessão-de-estudo)
7. [Configuração de Servidor](#configuração-de-servidor)
8. [Dicas e Truques](#dicas-e-truques)

---

## Introdução

Bem-vindo ao **StudiaBot**! 🎓

O StudiaBot é um bot Discord projetado para ajudar comunidades de estudo a rastrearem seu progresso de aprendizagem. Ele oferece:

✅ Sistema de **níveis e XP**  
✅ **Rastreamento automático** de tempo de estudo em canais de voz  
✅ **Tabela de ranks** progressivos  
✅ **Gerenciamento de canais** de estudo personalizados  
✅ **Perfil pessoal** com estatísticas

---

## Começando (Primeiros Passos)

### 1️⃣ Adicionar o Bot ao Servidor

O administrador do servidor deve adicionar o StudiaBot ao servidor Discord. O bot receberá automaticamente um cargo chamado "StudiaBot" com as permissões necessárias.

### 2️⃣ ⚠️ CONFIGURAR OS CANAIS DE ESTUDO (OBRIGATÓRIO)

**Comando:** `/configurar`

**IMPORTANTE:** Este é o **primeiro comando que DEVE ser executado** por um administrador. Sem ele, o bot não funcionará corretamente!

Um administrador deve executar:

```
/configurar
```

Depois clicar no botão **"🎙️ Configurar Dynamic Voices"**

Isso irá:

- ✅ Criar uma categoria chamada "Estudos"
- ✅ Criar canal de voz "estudo-voz"
- ✅ Criar canal de texto "estudo-texto"
- ✅ Configurar permissões automáticas

**Resposta esperada:**

```
Categoria "Estudos" criada com sucesso com os canais: #estudo-texto e 🎤estudo-voz
```

### 3️⃣ Registrar sua Conta

**Comando:** `/registrar`

Após os canais serem configurados, você pode se registrar no sistema de XP/Level.

```
/registrar
```

O bot irá:

- Criar seu perfil no sistema
- Inicializar seu nível em 0
- Registrar seu ID do Discord
- Salvar seu username

**Resposta esperada:**

```
@usuario foi registrado com sucesso!
```

⚠️ **Nota:** Você só precisa registrar uma vez por servidor. **Só funciona após `/configurar` ter sido executado!**

---

## Comandos Disponíveis

### ⚙️ `/configurar` (OBRIGATÓRIO)

**🔴 EXECUTE ESTE COMANDO PRIMEIRO!**

Permite ao administrador configurar os canais de estudo dinâmicos. **Este comando é essencial** - sem ele, o bot não pode funcionará.

```
/configurar
```

**O que faz:**

- Cria uma **nova categoria** chamada "Estudos"
- Cria um **canal de voz** chamado "estudo-voz"
- Cria um **canal de texto** chamado "estudo-texto"
- Configura as **permissões automáticas**

**Benefícios:**

- Tempo em canais de voz é **registrado automaticamente**
- Usuários ganham **XP** pelo tempo de estudo
- Pode **personalizar os nomes** dos canais depois

🔔 **Importante:** Apenas o proprietário do canal e admins podem gerenciar os canais.

**Resposta esperada:**

```
Categoria "Estudos" criada com sucesso com os canais: #estudo-texto e 🎤estudo-voz
```

---

### 🏓 `/ping`

Verifica a conexão com o bot.

```
/ping
```

**Resposta:** `Pong!`

**Uso:** Útil para verificar se o bot está online e respondendo.

---

### 👤 `/nivel`

Exibe seu perfil pessoal com suas estatísticas de progresso.

```
/nivel
```

**Informações exibidas:**

- 📊 **Nível atual** - Seu nível de 0 a 100+
- ⭐ **XP** - Pontos de experiência acumulados
- 🏆 **Título** - Seu rank/titulo baseado no nível (ex: Bronze I, Prata II, etc.)
- 📅 **Data de registro** - Quando você se registrou no servidor

**Exemplo de resposta:**

```
Perfil do usuario
Nivel: 15
XP: 1250
Titulo: Prata I
Registrado em: 12/02/2026
```

---

### 🏆 `/ranks`

Mostra a **tabela completa de ranks** e seus níveis correspondentes.

```
/ranks
```

**O que você verá:**

- Lista de todos os 22 ranks disponíveis
- Intervalo de níveis para cada rank
- Progressão até o rank máximo (Lenda)

**Ranks disponíveis (em ordem):**

1. Bronze I (Níveis 1-5)
2. Bronze II (Níveis 6-9)
3. Bronze III (Níveis 10-14)
   ... até ...
4. Lenda (Nível 100+)

---

### ⏱️ `/tempo`

Mostra seu tempo total de estudo na **sessão atual**.

```
/tempo
```

**Informações exibidas:**

- ⏳ **Tempo decorrido** - Quanto tempo você estudou nesta sessão
- 🎁 **Multiplicadores ativos** - Bônus sendo aplicados
- 🔄 **Botão Atualizar** - Recarrega os dados sem reexecutar o comando

**O que é uma sessão?**

- Uma sessão começa quando você **entra em um canal de voz configurado**
- Termina quando você **sai do canal**
- O tempo é **registrado automaticamente**

**Exemplo de resposta:**

```
SESSÃO ATUAL
⏱️ Tempo Decorrido: 01:30:45 (90 minutos)
🎁 MULTIPLICADORES ATIVOS
Multiplicador Total: 1.0x
```

---

### 📝 `/todo`

Criar notas/lembretes pessoais.

```
/todo [texto]
```

**Exemplo:**

```
/todo Assistir aula de matemática até terça
```

⚠️ **Status:** Este comando não está totalmente funcional no momento.

---

## Sistema de XP e Níveis

### 💡 Como você ganha XP?

Você ganha XP **automaticamente** quando:

- 🎤 Fica em um **canal de voz configurado** do servidor
- ⏱️ Permanece no canal por **tempo contínuo**
- 📈 Quanto mais tempo, **mais XP**!

### 📊 Progressão de Níveis

O sistema funciona assim:

- Comece no **Nível 0** quando se registrar
- Ganhe XP participando em canais de voz
- Suba de nível automaticamente conforme acumula XP
- Máximo: **Nível 100** (Rank Lenda)

### 🎯 Visualizar Seu Progresso

Use `/nivel` para:

- Ver seu **nível atual**
- Ver seu **total de XP**
- Ver seu **rank/título**
- Ver quando você se **registrou**

---

## Tabela de Ranks

### 🏅 Os 22 Ranks Disponíveis

| Tier | Rank         | Níveis |
| ---- | ------------ | ------ |
| 🥉   | Bronze I     | 1-5    |
| 🥉   | Bronze II    | 6-9    |
| 🥉   | Bronze III   | 10-14  |
| 🥈   | Prata I      | 15-19  |
| 🥈   | Prata II     | 20-23  |
| 🥈   | Prata III    | 24-28  |
| 🥇   | Ouro I       | 29-33  |
| 🥇   | Ouro II      | 34-37  |
| 🥇   | Ouro III     | 38-42  |
| 💜   | Platina I    | 43-47  |
| 💜   | Platina II   | 48-51  |
| 💜   | Platina III  | 52-56  |
| 💎   | Diamante I   | 57-61  |
| 💎   | Diamante II  | 62-65  |
| 💎   | Diamante III | 66-70  |
| 👑   | Campeão I    | 71-75  |
| 👑   | Campeão II   | 76-79  |
| 👑   | Campeão III  | 80-84  |
| 🧙   | Mestre I     | 85-89  |
| 🧙   | Mestre II    | 90-93  |
| 🧙   | Mestre III   | 94-99  |
| ⭐   | Lenda        | 100+   |

**Como usar?**
Execute `/ranks` para ver a tabela formatada no Discord!

---

## Sistema de Sessão de Estudo

### 🎓 O que é uma Sessão?

Uma **sessão de estudo** é o período que você passa estudando em um canal de voz configurado pelo bot.

### 📍 Como Iniciar uma Sessão?

1. Vá para o **canal de voz chamado "estudo-voz"** (ou similar)
2. Clique para **entrar no canal**
3. A sessão **inicia automaticamente**
4. Você começa a **ganhar XP**

### ⏹️ Como Encerrar uma Sessão?

Simplesmente **saia do canal de voz**. A sessão encerra automaticamente.

### ⏱️ Verificar Tempo da Sessão Atual

Use `/tempo` para ver:

- Quanto tempo você **já estudou** nesta sessão
- Quantos **minutos/horas/segundos** decorreram
- Qualquer **multiplicador ativo**

### 🔄 Botão "Atualizar"

No comando `/tempo`, há um botão **🔄 Atualizar** que:

- ✅ Recarrega os dados em tempo real
- ✅ Não reexecuta o comando inteiro
- ✅ Mostra o tempo **atualizando em tempo real**

---

## Configuração de Servidor

### 🛠️ Setup Inicial do Servidor

#### Passo 1: Adicionar o Bot

Um administrador deve convidar o StudiaBot para o servidor.

#### Passo 2: Criar Cargo Automático

O bot **cria automaticamente** um cargo chamado "StudiaBot" com as permissões necessárias.

#### 🔴 Passo 3: CONFIGURAR CANAIS DE ESTUDO (CRÍTICO!)

**Este é o passo mais importante - SEM ELE O BOT NÃO FUNCIONA!**

Um administrador deve executar:

```
/configurar
```

Depois clicar no botão **"🎙️ Configurar Dynamic Voices"**

Isso irá:

- ✅ Criar uma categoria chamada "Estudos"
- ✅ Criar canal de voz "estudo-voz"
- ✅ Criar canal de texto "estudo-texto"
- ✅ Configurar permissões automáticas
- ✅ Ativar o rastreamento de XP

**Você DEVE fazer este passo antes de qualquer outro comando funcionar!**

#### Passo 4: Usuários se Registram

Após o Passo 3 ser completado, cada usuário executa:

```
/registrar
```

E está pronto para começar a ganhar XP!

### 📋 Permissões Necessárias

O bot precisa das seguintes permissões:

- 🔑 **Gerenciar Canais** - Para criar/deletar canais
- 🔑 **Gerenciar Funções/Cargos** - Para criar o cargo do bot
- 🔑 **Visualizar Canais** - Para acessar canais
- 🔑 **Enviar Mensagens** - Para responder aos comandos

---

## Dicas e Truques

### 💡 Estratégias para Ganhar XP Rápido

1. **Sessões Longas** - Quanto mais tempo você fica em um canal de voz, mais XP ganha
2. **Consistência** - Estude regularmente para subir de nível
3. **Grupo** - Estude com outras pessoas em canais de voz para manter a motivação
4. **Multiplicadores** - Fique atento a multiplicadores especiais (quando disponíveis)

### 🎯 Metas e Objetivos

- **Bronze** (1-14) - Iniciante, dedicação inicial
- **Prata** (15-28) - Compromisso crescente
- **Ouro** (29-42) - Estudante dedicado
- **Platina** (43-56) - Muito comprometido
- **Diamante** (57-70) - Excelência
- **Campeão** (71-84) - Maestria
- **Mestre** (85-99) - Dedicação extrema
- **Lenda** (100+) - O pico!

### ❓ Perguntas Frequentes

**P: Quanto XP ganho por tempo estudado?**  
R: O sistema ajusta baseado em sua atividade no canal de voz.

**P: Posso ganhar XP em qualquer canal de voz?**  
R: Não, apenas em canais configurados pelo bot (ex: estudo-voz).

**P: Meu XP foi zerado! O que fazer?**  
R: Sua progressão não deve desaparecer. Se isso acontecer, contate os admins.

**P: Posso trocar de servidor e manter meu nível?**  
R: Não, seus níveis são **por servidor**. Você tem um perfil separado em cada servidor.

**P: Como vejo o XP total da comunidade?**  
R: Atualmente não há um leaderboard global, mas pode estar em desenvolvimento!

---

## 📞 Suporte

Tem uma dúvida ou encontrou um bug?

- 📧 Contate um **administrador** do servidor
- 🐛 Reporte bugs no servidor de suporte
- 💬 Discuta tips e tricks no canal de texto do servidor

---

## 🎉 Conclusão

Você agora está pronto para usar o **StudiaBot**!

**Sequência de primeiros passos:**

1. 🔴 **`/configurar`** - **PRIMEIRO** (obrigatório para admin)
2. `/registrar` - Se registre (após os canais serem criados)
3. `/nivel` - Veja seu perfil
4. `/ranks` - Veja os ranks disponíveis
5. Entre em um canal de voz e comece a estudar!
6. `/tempo` - Monitore sua sessão

**Boa sorte em sua jornada de estudo!** 🚀📚

---

_Documentação do StudiaBot v1.0_  
_Atualizado em: 12 de fevereiro de 2026_
