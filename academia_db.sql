-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 28/07/2026 às 15:29
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `academia_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `pagamentos`
--

CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_pagamento` date NOT NULL,
  `status` enum('PAGO','PENDENTE','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  `mes_referencia` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `pagamentos`
--

INSERT INTO `pagamentos` (`id`, `usuario_id`, `valor`, `data_pagamento`, `status`, `mes_referencia`, `created_at`) VALUES
(1, 5, 80.00, '2026-07-27', 'PAGO', 'Julho 2026', '2026-07-27 14:35:16'),
(2, 7, 80.00, '2026-07-27', 'PAGO', 'Julho 2026', '2026-07-27 14:48:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `treinos`
--

CREATE TABLE `treinos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descricao` text NOT NULL,
  `dia_semana` varchar(50) DEFAULT 'Geral',
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `treinos`
--

INSERT INTO `treinos` (`id`, `usuario_id`, `titulo`, `descricao`, `dia_semana`, `data_criacao`) VALUES
(1, 6, 'Treino A ', 'Supino reto - 4x12\nTriceps Corda - 4x12\nSupino inclinado - 4x12', 'Segunda-feira', '2026-07-25 10:13:53'),
(3, 6, 'Treino - B', 'Bulgaro - 4x15\nAgachamento - 4x15\nLegPress - 4x15', 'Terça-feira', '2026-07-26 15:55:55');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `matricula` varchar(10) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_nascimento` date NOT NULL,
  `foto_url` longtext DEFAULT NULL,
  `data_cadastro` date NOT NULL DEFAULT curdate(),
  `data_vencimento` date NOT NULL,
  `agendar_aula_experimental` datetime DEFAULT NULL,
  `realizou_avaliacao` tinyint(1) DEFAULT 0,
  `tipo_usuario` tinyint(4) NOT NULL DEFAULT 3 COMMENT '1: Admin, 2: Professor, 3: Aluno'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `matricula`, `nome`, `email`, `senha`, `telefone`, `data_nascimento`, `foto_url`, `data_cadastro`, `data_vencimento`, `agendar_aula_experimental`, `realizou_avaliacao`, `tipo_usuario`) VALUES
(5, 'R85882', 'RAIF RAUDA PEREIRA DE SOUZA', 'rauda131@gmail.com', '$2b$10$QCsaZ3kdXpvKrLhegtOVfeZE3rASSqK2FTt.KZFmBTGQL9PWPsvfi', '91985085882', '1993-12-16', NULL, '2026-07-22', '2026-08-15', '2026-07-23 20:20:00', 0, 1),
(6, 'C20882', 'Carolina Passaro Pereira Santos ', 'carolina.passaro19@gmail.com', '$2b$10$U3uSDxkBlIQmuh8bSpYJQ.yqfw5/qdP/KzdJa2qVTf1f20s8CmBqy', '91985720882', '1988-08-10', NULL, '2026-07-22', '2026-08-15', '2026-07-23 20:20:00', 0, 3),
(7, 'C25418', 'Carlos Tiago Saraiva Trindade', 'xxtiagocarlos@live.com', '$2b$10$VC2B8.i9P.u5S6rSDf4sHu75RgCMNK.2Oo6Hx0L.nYpXyuCoampay', '91991625418', '1992-10-25', 'data:image/jpeg;base64,/9j/4Q50RXhpZgAATU0AKgAAAAgABwESAAMAAAABAAEAAAEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIAAAExAAIAAAAeAAAAcgEyAAIAAAAUAAAAkIdpAAQAAAABAAAApAAAANAACvyAAAAnEAAK/IAAACcQQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykAMjAyNjowNzoxNiAxNjo1MDo0', '2026-07-26', '2026-08-10', '2026-07-27 17:49:00', 0, 3);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `treinos`
--
ALTER TABLE `treinos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `treinos`
--
ALTER TABLE `treinos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `treinos`
--
ALTER TABLE `treinos`
  ADD CONSTRAINT `treinos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
