import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Traduz os tokens de `pdv_tokens.dart` para o `ThemeData` do Material.
///
/// **Para mudar a aparência do app, edite `pdv_tokens.dart`, não este arquivo.**
/// Aqui só se mexe quando um componente do Material precisa de um ajuste que os
/// tokens não expressam.
///
/// **O PDV tem um tema só, e ele é escuro.** Não existe modo claro nem
/// acompanhamento da preferência do sistema: o terminal fica ligado o turno
/// inteiro, muitas vezes de frente para uma vitrine, e uma tela clara nesse
/// cenário vira espelho. Um tema só também elimina a classe de bug em que uma
/// tela é conferida num modo e quebra no outro.
///
/// `colorScheme.brightness` é marcado como escuro — não por enfeite: é o sinal
/// que componentes do Material leem para escolher os próprios padrões.
abstract final class PdvTheme {
  /// [largeScrollbars] engrossa a barra de rolagem — preferência de terminal
  /// com tela sensível ao toque (Configurações → Touch screen).
  static ThemeData data({bool largeScrollbars = false}) {
    const ColorScheme scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: PdvColors.brand,
      onPrimary: PdvColors.onBrand,
      primaryContainer: PdvColors.brandSurface,
      onPrimaryContainer: PdvColors.textPrimary,
      secondary: PdvColors.surfaceMuted,
      onSecondary: PdvColors.textPrimary,
      error: PdvColors.danger,
      onError: PdvColors.onBrand,
      errorContainer: PdvColors.dangerSurface,
      onErrorContainer: PdvColors.danger,
      surface: PdvColors.surface,
      onSurface: PdvColors.textPrimary,
      onSurfaceVariant: PdvColors.textSecondary,
      surfaceContainerLowest: PdvColors.surface,
      surfaceContainerLow: PdvColors.background,
      surfaceContainer: PdvColors.surfaceMuted,
      inverseSurface: PdvColors.surfaceOverlay,
      onInverseSurface: PdvColors.textOverlay,
      outline: PdvColors.border,
      outlineVariant: PdvColors.borderStrong,
    );

    final TextTheme textTheme = _textTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: textTheme,
      fontFamily: PdvTypography.fontFamily,
      scaffoldBackgroundColor: PdvColors.background,
      canvasColor: PdvColors.background,
      dividerColor: PdvColors.border,

      // O padrão do Material 3 é `InkSparkle`, que depende de um fragment
      // shader e em Linux/Windows costuma sair invisível ou nem renderizar.
      // `InkRipple` é o splash clássico e se comporta igual nas três
      // plataformas que o PDV atende.
      splashFactory: InkRipple.splashFactory,

      // Transição curta e sem paralaxe em toda plataforma. Ver `PdvMotion`.
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
        },
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: PdvAppBarColors.background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: PdvAppBarColors.foreground,
        elevation: 0,
        scrolledUnderElevation: 0,
        toolbarHeight: PdvSizes.appBarHeight,
        centerTitle: false,
        titleTextStyle: textTheme.headlineSmall,
      ),

      cardTheme: const CardThemeData(
        color: PdvColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: PdvRadius.baseAll,
          side: BorderSide(color: PdvColors.border),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: PdvColors.border,
        thickness: PdvSizes.borderWidth,
        space: PdvSizes.borderWidth,
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: PdvColors.inputFill,
        // Vale para **todo** campo do app: o padrão do Material corta a
        // mensagem de erro em uma linha com reticências, e erro cortado é pior
        // que erro nenhum — o operador vê que falhou e não descobre o quê.
        errorMaxLines: 3,
        helperMaxLines: 2,
        isDense: false,
        constraints: const BoxConstraints(minHeight: PdvSizes.controlHeight),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: PdvSpacing.lg,
          vertical: PdvSpacing.lg,
        ),
        hintStyle: PdvTypography.bodyMd.copyWith(color: PdvColors.textDisabled),
        labelStyle: PdvTypography.label.copyWith(
          color: PdvColors.textSecondary,
        ),
        floatingLabelStyle: PdvTypography.labelSm.copyWith(
          color: PdvColors.focusRing,
        ),
        helperStyle: PdvTypography.bodySm.copyWith(
          color: PdvColors.textSecondary,
        ),
        border: _inputBorder(PdvColors.border),
        enabledBorder: _inputBorder(PdvColors.border),
        focusedBorder: _inputBorder(
          PdvColors.focusRing,
          width: PdvSizes.borderWidthFocus,
        ),
        errorBorder: _inputBorder(PdvColors.danger),
        focusedErrorBorder: _inputBorder(
          PdvColors.danger,
          width: PdvSizes.borderWidthFocus,
        ),
        disabledBorder: _inputBorder(PdvColors.border),
      ),

      // O realce é sempre claro: num tema escuro, escurecer um controle já
      // escuro não se vê. Um overlay invisível é exatamente o erro que faz o
      // operador achar que o botão não respondeu e tocar de novo.
      filledButtonTheme: FilledButtonThemeData(
        style: _buttonStyle().copyWith(
          backgroundColor: const WidgetStatePropertyAll<Color>(PdvColors.brand),
          foregroundColor: const WidgetStatePropertyAll<Color>(
            PdvColors.onBrand,
          ),
          overlayColor: _overlay(PdvColors.onBrand),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _buttonStyle().copyWith(
          backgroundColor: const WidgetStatePropertyAll<Color>(PdvColors.brand),
          foregroundColor: const WidgetStatePropertyAll<Color>(
            PdvColors.onBrand,
          ),
          overlayColor: _overlay(PdvColors.onBrand),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: _buttonStyle().copyWith(
          backgroundColor: const WidgetStatePropertyAll<Color>(
            PdvColors.surface,
          ),
          foregroundColor: const WidgetStatePropertyAll<Color>(
            PdvColors.textPrimary,
          ),
          side: const WidgetStatePropertyAll<BorderSide>(
            BorderSide(color: PdvColors.border),
          ),
          overlayColor: _overlay(PdvColors.brand),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: _buttonStyle().copyWith(
          foregroundColor: const WidgetStatePropertyAll<Color>(
            PdvColors.textPrimary,
          ),
          overlayColor: _overlay(PdvColors.brand),
        ),
      ),

      iconButtonTheme: const IconButtonThemeData(
        style: ButtonStyle(
          minimumSize: WidgetStatePropertyAll<Size>(
            Size.square(PdvSizes.iconButton),
          ),
          shape: WidgetStatePropertyAll<OutlinedBorder>(
            RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
          ),
        ),
      ),

      iconTheme: const IconThemeData(
        color: PdvColors.textSecondary,
        size: PdvSizes.iconMd,
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: PdvColors.surface,
        // Sem isto vale o `black54` do Flutter, calibrado para app claro.
        barrierColor: PdvColors.barrier,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
        titleTextStyle: textTheme.headlineMedium,
        contentTextStyle: textTheme.bodyLarge,
        insetPadding: const EdgeInsets.symmetric(
          horizontal: PdvSpacing.xxl,
          vertical: PdvSpacing.xl,
        ),
        actionsPadding: const EdgeInsets.fromLTRB(
          PdvSpacing.xl,
          PdvSpacing.sm,
          PdvSpacing.xl,
          PdvSpacing.lg,
        ),
      ),

      drawerTheme: const DrawerThemeData(
        backgroundColor: PdvColors.surface,
        surfaceTintColor: Colors.transparent,
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: PdvColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: PdvRadius.baseTop),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: PdvColors.surfaceMuted,
        selectedColor: PdvColors.brand,
        side: BorderSide.none,
        labelStyle: PdvTypography.labelSm.copyWith(
          color: PdvColors.textPrimary,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: PdvSpacing.md,
          vertical: PdvSpacing.sm,
        ),
        shape: const RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
      ),

      listTileTheme: ListTileThemeData(
        minVerticalPadding: PdvSpacing.lg,
        minTileHeight: PdvSizes.controlHeight,
        iconColor: PdvColors.textSecondary,
        titleTextStyle: PdvTypography.bodyLg.copyWith(
          color: PdvColors.textPrimary,
        ),
        subtitleTextStyle: PdvTypography.bodySm.copyWith(
          color: PdvColors.textSecondary,
        ),
        shape: const RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
      ),

      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          visualDensity: VisualDensity.standard,
          textStyle: const WidgetStatePropertyAll<TextStyle>(
            PdvTypography.label,
          ),
          minimumSize: const WidgetStatePropertyAll<Size>(
            Size(0, PdvSizes.controlHeight),
          ),
          padding: const WidgetStatePropertyAll<EdgeInsetsGeometry>(
            EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
          ),
          shape: const WidgetStatePropertyAll<OutlinedBorder>(
            RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
          ),
        ),
      ),

      tooltipTheme: TooltipThemeData(
        decoration: const BoxDecoration(
          color: PdvColors.surfaceOverlay,
          borderRadius: PdvRadius.baseAll,
        ),
        textStyle: PdvTypography.bodySm.copyWith(color: PdvColors.textOverlay),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: PdvColors.surfaceOverlay,
        contentTextStyle: PdvTypography.bodyMd.copyWith(
          color: PdvColors.textOverlay,
        ),
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
      ),

      scrollbarTheme: ScrollbarThemeData(
        thickness: WidgetStatePropertyAll<double>(
          largeScrollbars
              ? PdvSizes.scrollbarThicknessTouch
              : PdvSizes.scrollbarThickness,
        ),
        // Sempre visível no modo toque: com o dedo não há hover para revelar
        // a barra, e uma barra que só aparece com o mouse não existe para
        // quem opera com o dedo.
        thumbVisibility: WidgetStatePropertyAll<bool>(largeScrollbars),
        radius: const Radius.circular(PdvRadius.base),
        thumbColor: const WidgetStatePropertyAll<Color>(PdvColors.borderStrong),
      ),

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith<Color>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected)
                  ? PdvColors.onBrand
                  : PdvColors.textSecondary,
        ),
        trackColor: WidgetStateProperty.resolveWith<Color>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected)
                  ? PdvColors.brand
                  : PdvColors.surfaceMuted,
        ),
      ),

      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: PdvColors.brand,
      ),
    );
  }

  static TextTheme _textTheme() {
    return TextTheme(
      displayLarge: PdvTypography.amountXl.copyWith(
        color: PdvColors.textPrimary,
      ),
      headlineLarge: PdvTypography.headingLg.copyWith(
        color: PdvColors.textPrimary,
      ),
      headlineMedium: PdvTypography.headingMd.copyWith(
        color: PdvColors.textPrimary,
      ),
      headlineSmall: PdvTypography.headingSm.copyWith(
        color: PdvColors.textPrimary,
      ),
      titleLarge: PdvTypography.headingSm.copyWith(
        color: PdvColors.textPrimary,
      ),
      titleMedium: PdvTypography.label.copyWith(color: PdvColors.textPrimary),
      titleSmall: PdvTypography.labelSm.copyWith(color: PdvColors.textPrimary),
      bodyLarge: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
      bodyMedium: PdvTypography.bodyMd.copyWith(color: PdvColors.textPrimary),
      bodySmall: PdvTypography.bodySm.copyWith(color: PdvColors.textSecondary),
      labelLarge: PdvTypography.label.copyWith(color: PdvColors.textPrimary),
      labelMedium: PdvTypography.labelSm.copyWith(color: PdvColors.textPrimary),
      labelSmall: PdvTypography.caption.copyWith(
        color: PdvColors.textSecondary,
      ),
    );
  }

  /// Traço do campo: **underline**, não contorno fechado.
  ///
  /// É o que separa o *filled* do *outlined* do Material. O campo do PDV é
  /// preenchido (`filled: true` + `PdvColors.inputFill`), e num campo
  /// preenchido o contorno em volta é redundante — o próprio fundo já desenha
  /// a caixa. Sobrava um retângulo dentro de outro.
  ///
  /// `borderRadius` acompanha `PdvRadius.base` (0 hoje): no underline ele
  /// arredonda só os cantos **de cima**, que é onde o preenchimento termina.
  static UnderlineInputBorder _inputBorder(
    Color color, {
    double width = PdvSizes.borderWidth,
  }) {
    return UnderlineInputBorder(
      borderRadius: PdvRadius.baseAll,
      borderSide: BorderSide(color: color, width: width),
    );
  }

  static ButtonStyle _buttonStyle() {
    return ButtonStyle(
      minimumSize: const WidgetStatePropertyAll<Size>(
        Size(0, PdvSizes.controlHeight),
      ),
      padding: const WidgetStatePropertyAll<EdgeInsetsGeometry>(
        EdgeInsets.symmetric(
          horizontal: PdvSpacing.xl,
          vertical: PdvSpacing.md,
        ),
      ),
      textStyle: const WidgetStatePropertyAll<TextStyle>(PdvTypography.label),
      shape: const WidgetStatePropertyAll<OutlinedBorder>(
        RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
      ),
      // Sem elevação: a interface é plana. Isso remove a sombra que o Material
      // usa para sinalizar o toque, então **todo** o feedback passa a vir do
      // overlay — que por isso é explícito, e não o default sutil do M3.
      elevation: const WidgetStatePropertyAll<double>(0),
      animationDuration: PdvMotion.fast,
    );
  }

  /// Camada de realce sobre um controle em hover, foco e toque.
  ///
  /// As opacidades são acima do padrão do Material (0,08 / 0,10). Num caixa o
  /// operador precisa saber que o toque pegou **sem olhar** — se ele duvida,
  /// toca de novo, e aí o item entra duas vezes no pedido.
  static WidgetStateProperty<Color?> _overlay(Color color) {
    return WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> states) {
      if (states.contains(WidgetState.pressed)) {
        return color.withValues(alpha: 0.22);
      }
      if (states.contains(WidgetState.hovered)) {
        return color.withValues(alpha: 0.10);
      }
      if (states.contains(WidgetState.focused)) {
        return color.withValues(alpha: 0.14);
      }
      return null;
    });
  }
}
