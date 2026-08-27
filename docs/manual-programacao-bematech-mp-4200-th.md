# POS Printer MP-4200 TH — Programmer's Manual

> Bematech S.A. — P/N 501.4421.00, Revision 1.0 (April 2010). Converted from the original PDF.
>
> **Note:** The character grids for code pages 437, 850, 858 and 860 in Appendix II are stored as images in the source PDF and cannot be extracted as text; only Code Page 866 is reproduced below.

Impressora Bematech MP-4200TH
A Impressora Bematech MP-4200 TH revolucionou o mercado,
proporcionando alto desempenho e qualidade de impressão da sua Nota
Fiscal Consumidor Eletrônica (NFC-e). O resultado de tudo isso é maior
agilidade no atendimento ao cliente, aumentando sua produtividade e o
seu lucro, sem prejudicar o seu estabelecimento e seu relacionamento
com os consumidores.

bztech.com.br

POS Printer MP-4200 TH Programmer’s Manual
P/N: 501.4421.00 - Revision 1.0

April 2010
(First Edition: April 2010)

Copyright© by Bematech S.A. Curitiba-PR, Brazil.
All rights reserved.

No part of this publication may be copied, reproduced, adapted or translated without the prior written permission
of Bematech S.A., except when allowed by patent rights.

Information in this publication is purely informative, subjected to change without notice and no liability is assumed
with respect to its use. However, as product improvements become available, Bematech S.A. will make every
effort to provide updated information for the products described in this publication. The latest version of this
manual can be obtained through Bematech web site:

www.bematech.com

Not withstanding the other exceptions contained in this Manual, the consequences and responsibility are assumed
by the Purchaser of this product or third parties as a result of: (a) intentional use for any improper, unintended
or unauthorized applications of this product, including any particular purpose; (b) unauthorized modifications,
repairs, or alterations to this product; (c) use of the product without complying with Bematech S.A. Corporation’s
operating and maintenance instructions; (d) use of the product as component in systems or other applications in
which the failure of this could create a situation where personal injury or material damages may occur. In the
events described above, Bematech S.A. and its officers, administrators, employees, subsidiaries, affiliates and
dealers shall not be held responsible or respond by any claim, costs, damages, losses, expenses and any other
direct or indirect injury, as well as claims which alleges that Bematech S.A. was negligent regarding the design
or manufacture of the product.

Bematech S.A. shall not be liable against any damages or problems arising from the use of any options or any
consumable products other than those designated as original Bematech products or approved products by
Bematech S.A.

Any product names or its logotypes mentioned in this publication may be trademarks of its respective owners and
shall be here recognized.

Product warranties are only the ones expressly mentioned in the User’s Manual. Bematech S.A. disclaims any and
all implied warranties for the product, including but not limited to implied warranties of merchantability or fitness
for a particular purpose. In addition, Bematech S.A. shall not be responsible or liable for any special, incidental
or consequential damages or lost profits or savings arising from the use of the product by the Purchaser, the User
or third parties.

## Disposal and Recycling Information

General Information
This symbol indicates that your product must be disposed of properly according to local laws and
regulations. When your product reaches its end of life, contact Bematech or your local authorities to
learn about recycling options.

Safety Information
This section presents important information intended to ensure safe and effective use of this product. Please
read this section carefully and store it in an accessible location.

Electrical Safety
- To prevent electrical shock hazard, disconnect the power cable from the electrical outlet before relocating the
system.
- When adding or removing devices to or from the system, ensure that the power cables for the devices are
unplugged before the signal cables are connected. If possible, disconnect all power cables from the
existing system before you add a device.
- Before connecting or removing signal cables from the product, ensure that all power cables are
unplugged.
- Seek professional assistance before using an adapter or extension cord. These devices could interrupt the
grounding circuit.
- Make sure that your power supply is set to the correct voltage in your area. If you are note sure about the
voltage of the electrical outlet you are using, contact your local power company.
- If the power supply is broken, do not try to fix it by yourself. Contact a qualified service technician or your
retailer.

Operation Safety
- Before installing the product and adding devices on it, carefully read all the manuals that came with the
package.
- Before using the product, make sure all cables are correctly connected and the power cables are not damaged.
If you detect any damage, contact you retailer immediately.
- To avoid short circuits, keep paper clips, screws, and staples away from connectors, slots, sockets and
circuitry.
- Avoid dust, humidity, and temperature extremes. Do not place the product in any area where it may become
wet.
- Place the product on a stable surface.
- If you encounter technical problems with the product, contact a qualified service technician or you
retailer.

## Summary

- List of Tables

- Acronyms and Abbreviations

- Revision History

- Chapter 1: Introduction
  - 1.1 Objective
  - 1.2 Structure
- Chapter 2: Quick Reference Guide
  - 2.1 ESC/Bema Quick Reference Guide
  - 2.2 ESC/POS® Quick Reference Guide
- Chapter 3: ESC/Bematech Command Set
- ESC/Bematech Command Set
- Chapter 4: ESC/POS® Command Set
- ESC/POS® Command Set
- Appendix I – Tables
  - Table 1 - Characters Per Line
- Appendix II – Character Tables
  - ASCII
  - Code Page 437
  - Code Page 850
  - Code Page 858
  - Code Page 860
  - Code Page 866
- Appendix III - Transmission Status Identification

## List of Tables

  - Table 1: Arguments used to describe MP-4200 TH commands

  - Table 2: Printer settings commands for ESC/Bema mode

  - Table 3: Vertical positioning commands for ESC/Bema mode

  - Table 4: Horizontal positioning commands for ESC/Bema mode

  - Table 5: Character formatting commands for ESC/Bema mode

  - Table 6: Print width, character width and height commands for ESC/Bema mode

  - Table 7: Bitmap and graphic commands for ESC/Bema mode

  - Table 8: Communication related commands for ESC/Bema mode

  - Table 9: Data control related commands for ESC/Bema mode

  - Table 10: Barcode commands for ESB/Bema mode

  - Table 11: Standard commands for ESC/POS® mode

  - Table 12: Ideograms control commands for ESC/POS® mode

  - Table 13: Miscellaneous commands for ESC/POS® mode

## Acronyms and Abbreviations

Abreviation    Significance
bit            Binary digit
dpi            Dots per inch
JIS            Japanese Industrial Standards
TCP/IP         Suite of protocols used for Internet communication
USB            Universal Serial Bus
UTF-8          8-bit Unicode Transformation Format

## Revision History

Date                         Version          Description
April 2010                   1.0              Initial release.

# Chapter 1: Introduction

MP-4200 TH is a Bematech thermal printer designed to speed up receipt printing operations with high
performance in both text and graphic modes. Its main features include:
- Printing speeds of up to 250mm/s in both text and graphic modes.
- Four paper widths: 58mm, 76mm, 80mm or 82.5mm.
- Two commands sets: ESC/Bematech or ESC/POS®.
- One USB device interface always available to connect with host computers.
- Two different models of optional serial RS-232 interfaces cards, one using a DB-9 connector and another
using DB-25 connector, to allow serial communication with legacy and embedded hosts.
- One optional 10/100Mbit Ethernet interface card with integrated TCP/IP stack for wired remote printing
through local area networks.
- One optional IEEE 802.11b/g Wi-Fi interface card with integrated TCP/IP stack for wireless remote
printing through local area networks.
- Seven code pages available: 437 (USA and Standard Europe), 850 (Multilingual “Latin-1” – Western
European Languages), 858 (Multilingual with Euro symbol), 860 (Portuguese), 862 (Hebrew), 864 (Arabic)
and 866 (Cyrillic).
- Supports Traditional Chinese (Big 5E) and Simplified Chinese (GB2312 or EUC-CN).
- Supports Japanese (JIS and Shift JIS).
- Supports UTF-8 characters.
- Can generate fourteen different types of unidimensional bar codes (EAN-8, EAN-13, Code 39, Code 93,
Code 128 (A, B and C), ITF, Codabar, UPC-A, UPC-E, ISBN, MSI or Plessey).
- Can generate PDF-417 bidimensional bar code.
- May be used to control up to two external cash drawers.
- Dot density of 203 x 203 dpi.

## 1.1 Objective

The purpose of this manual is to provide to developers and programmers detailed information about MP-4200
TH operation. All available commands are described to allow the use of MP-4200 TH to print receipts for any kind
of application.

## 1.2 Structure

This manual is organized in four chapters. This first chapter provides some highlights about MP-4200 TH
thermal printer and also some information on how to use this manual. The second chapter presents a summary
of all the commands supported by the MP-4200 TH in a form of a quick reference guide. The third chapter
provides in depth information about every command available in the ESC/Bematech mode of operation. The fourth
chapter provides in depth information about every ESC/POS® command supported by MP-4200 TH printer when
operating in the ESC/POS mode of operation.
Chapters three and four describe commands using up to nine arguments, as described in Table 1.

**Arguments used to describe MP-4200 TH commands.**

| Argument | Significance |
| --- | --- |
| [Function] | Short description of the command functionality. |
| [Format] | Command code sequence. |
| [Range] | Shows command arguments ranges, if applicable. |
| [Default] | Gives default values for parameters, if applicable. |
| [Description] | Describes what the command does. |
| [Details] | Describes the usage of the command in detail and also its limitations. |
| [Notes] | Provides important information on setting and using the printer command, if necessary. |
| [References] | Lists related commands, if applicable. |
| [Example] | Provides a short example on how to use the command. |

# Chapter 2: Quick Reference Guide

MP-4200 TH is a dual command set printer. A command set describes the behavior of the printer when
sequences of bytes are received through the communication interface. The two command sets available at the
MP-4200 TH are ESC/Bematech (or ESC/Bema for short) and ESC/POS®, but only one of them is active at
a given time. There are commands specifically designed to switch from current command set to the other.

## 2.1 ESC/Bema Quick Reference Guide

ESC/Bema is a standard developed by Bematech, its partners and customers during
several years of operation in the South America retail and bank automation markets.
The syntax used to summarize ESC/Bema commands in the tables
throughout this section is described in the bullets below:

- ESC P means a command with no parameters.
- ESC Q n means a command with one parameter.
- ESC K n1 n2 means a command with two parameters.
- ESC D n1 ... nk means a command with variable number of parameters.

In the bullets above the ESC symbol represents the hexadecimal number 1B, according to ASCII table. The
character P represents the hexadecimal number 50, as defined in the ASCII table too. In some circumstances
hexadecimal numbers between 7F and FF can also be used as a part of a command. As these values cannot
be represented using ASCII table, they will be represented with the value followed by the ‘h’ character.
In the next tables ESC/Bema commands are summarized.

**Printer settings commands for ESC/Bema mode**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| GS F9h 5 n | Select printer operating mode and save selected option to configuration memory. | 1D F9 35 n |
| GS F9h 7 n | Set and save printer default code page for ESC/Bema command set. | 1D F9 37 n |
| GS F9h 8 n | Set and save ESC/POS ideogram mode. | 1D F9 38 n |
| GS F9h C 00h | Get printer current command set. | 1D F9 43 00 |
| GS F9h SP n | Select printer operating mode without saving selected option to printer configuration memory. | 1D F9 20 n |
| GS F9h 1Fh 1 | Return to mode in use prior to sending GS F9h SP n command. | 1D F9 1F 31 |
| ESC @ | Initialize printer to its default settings. | 1B 40 |
| ESC b n | Select paper sensor to output paper-end signal. | 1b 62 n |
| ESC v n | Activate drawer #1 for n milliseconds | 1B 76 n |
| ESC 80h n | Activate drawer #2 for n milliseconds | 1B 80 n |
| ESC i | Perform full paper cut | 1B 69 |
| ESC w | Perform full paper cut | 1B 77 |
| ESC m | Perform partial paper cut | 1B 6D |
| ESC y n | Enable/disable panel keys | 1B 79 n |
| ESC x | Enable dump mode | 1B 78 |
| ESC z n | Enable/disable automatic line feed | 1B 7A n |
| A pL pH fn n1 n2 vol         Activat | e/deactivate buzzer                1B 28 41 pL | pH fn n1 n2 vol |
| – n                         Set and | save printer mode                 1D F9 2D n |  |
| ! n                         Set and | save paper width                  1D F9 21 n |  |
| , n                         Enable/ | disable paper near-end sensor      1D F9 2C n |  |
| + n                         Set and | save printing intensity           1D F9 2B n |  |
| n                           Set and | save printer language             1D FA n |  |
| ‘ n                         Get pri | nter information                   1D F9 27 n |  |
| ( 0                         Load de | fault user configuration           1D F9 28 30 |  |
| ) 0                         Print u | ser configuration                  1D F9 29 30 |  |
| F                           Printer | reset                             1D F8 46 |  |
| BS NUL “ i1…i4 s1…s4        Set IP | address and subnet mask            1D F7 08 00 | 22 i1…i4 s1…s4 |
| EOT NUL ‘ g1…g4             Set def | ault gateway IP address            1D F7 04 00 | 27 g1…g4 |
| D m n                       Activat | e buzzer on cut                    1D F9 44 m n |  |
| E n                         Set DHC | P usage                            1D F9 45 n |  |
| S m ip1..ip4 n c1..cn       Set SNM | P settings                         1D F9 53  m | ip1..ip4 n c1..cn |
| W a s c m n e1..em p1..pn   Set Wi- | Fi settings                        1D F9 57 a s | c m n e1..em p1..pn |

**Vertical positioning commands**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| ESC C n | Set page size in lines | 1B 43 n |
| ESC c n1 n2 | Set page size in millimeters | 1B 63 n1 n2 |
| ESC J n | Performs a fine line feed | 1B 4A n |
| FF | Feed one page | 0C |
| LF | Feed one line | 0A |
| ESC 2 | Set text line height to 1/6 inches | 1B 32 |
| ESC 3 n | Set line feed to n/144 inches | 1B 33 n |
| ESC f 1 n | Vertical skipping | 1B 66 31 n |
| ESC A n | Feed paper by [n x 0,375]mm | 1B 41 n |

**Horizontal positioning commands**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| ESC f 0 n | Horizontal skipping | 1B 66 30 n |
| HT | Horizontal tab | 09 |
| ESC D n1…nk NUL | Set horizontal tab marks | 1B 44 n1…nk 00 |
| ESC Q n | Set right margin | 1B 51 n |
| ESC l n | Set left margin | 1B 6C n |
| ESC a n | Character alignment | 1B 61 n |

**Character formatting commands**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| ESC – n | Enable/disable underline print mode | 1B 2D n |
| ESC 4 | Enable italic print mode | 1B 34 |
| ESC 5 | Disable italic print mode | 1B 35 |
| ESC E | Enable emphasized print mode | 1B 45 |
| ESC F | Disable emphasized print mode | 1B 46 |
| ESC t n | Codepage selection | 1B 74 n |
| ESC R n | Select an international character set | 1B 52 n |
| ESC S n | Enable superscript and/or subscript print modes | 1B 53 n |
| ESC T | Disable superscript and subscript print modes | 1B 54 |
| ESC N n | Select printing intensity | 1B 4E n |
| ESC ! n | Select print mode | 1B 21 n |
| ESC } n | Turn upside-down printing mode on/off | 1B 7D n |
| ESC Z | Print supported Unicode sets | 1B 5A |
| ESC [ n | Print a specific Unicode set | 1B 5B n |

**Print width, character width and height commands**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| DC2 | Disable condensed mode | 12 |
| DC4 | Disable on-line expanded print | 14 |
| ESC d n | Enable/disable double height print mode | 1B 64 n |
| ESC H | Disable condensed mode | 1B 48 |
| ESC P | Disable condensed mode | 1B 50 |
| ESC SI | Enable condensed mode | 1B 0F |
| ESC SO | Enable on-line expanded mode | 1B 0E |
| ESC V | Enable on-line double height mode | 1B 56 |
| ESC W n | Enable/disable expanded mode | 1B 57 n |
| SI | Enable condensed mode | 0F |
| SO | Enable on-line expanded mode | 0E |

**Bitmap and graphic**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| ESC $ n1 n2 | Fill in blank bit columns | 1B 24 n1 n2 |
| ESC \* ! n1 n2 b1...bn | 24-bit graphics | 1B 2A 21 n1 n2 b1 ... bn |
| ESC K n1 n2 b1...bn | 8-bit graphics | 1B 4B n1 n2 b1 ... bn |
| FS p n m | Print NV bit image | 1C 70 n m |
| FS q n [xL xH yL yH d1...dk]1...[xL xH yL yH d1... | Define NV bit image | 1C 71 n [xL xH yL yH d1...dk]1...[xL xH yL yH |
| dk]n |  | d1...dk]n |
| GS / m | Print downloaded bit image | 1D 2F m |
| GS \* x y d1...d(x × y × 8) | Define downloaded bit image | 1D 2A x y d1...d(x × y × 8) |
| GS v 0 m xL xH yL yH d1...dk | Print raster bitmap | 1D 76 30 m xL xH yL yH d1...dk |

**Communication related**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| ENQ | Printer status enquiry | 05 |
| GS F8h 1 | Printer extended status enquiry | 1D F8 31 |
| ETX | End buffer | 03 |
| STX | Clear buffer | 02 |

**Data control related**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| CAN | Cancel last line | 18 |
| DEL | Cancel last character | 7F |

**Barcode commands**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| GS h n | Set barcode height | 1D 68 n |
| GS w n | Set barcode width | 1D 77 n |
| GS H n | Choose the position of human readable information (HRI) in the barcode | 1D 48 n |
| GS f n | Set the font to be used for human readable information (HRI) | 1D 66 n |
| GS k NUL d1…d11 NUL | Print an UPC-A barcode | 1D 6B 00 d1…d11 00 |
| GS k A VT d1...d11 | Print an UPC-A barcode | 1D 6B 41 0B d1…d11 |
| GS k SOH d1…d6 NUL | Print an UPC-E barcode | 1D 6B 01 d1…d6 00 |
| GS k B ACK d1…d6 | Print an UPC-E barcode | 1D 6B 42 06 d1…d6 |
| GS k STX d1…d12 NUL | Print an EAN-13 barcode | 1D 6B 02 d1…d12 00 |
| GS k C FF d1…d12 | Print an EAN-13 barcode | 1D 6B 43 0C d1…d12 |
| GS k ETX d1…d7 NUL | Print an EAN-8 barcode | 1D 6B 03 d1…d7 00 |
| GS k D BEL d1…d7 | Print an EAN-8 barcode | 1D 6B 44 07 d1…d7 |
| GS k EOT d1…dn NUL | Print a CODE 39 barcode | 1D 6B 04 d1…dn 00 |
| GS k E n d1…dn | Print a CODE 39 barcode | 1D 6B 45 n d1…dn |
| GS k ENQ d1…dn NUL | Print an ITF barcode | 1D 6B 05 d1…dn 00 |
| GS k F n d1...dn | Print an ITF barcode | 1D 6B 46 n d1…dn |
| GS k ACK d1…dn NUL | Print a CODABAR barcode | 1D 6B 06 d1…dn 00 |
| GS k G n d1…dn | Print a CODABAR barcode | 1D 6B 47 n d1…dn |
| GS k H n d1…dn | Print a CODE 93 barcode | 1D 6B 48 n d1…dn |
| GS k I n d1…dn | Print a CODE 128 barcode | 1D 6B 49 n d1…dn |
| GS k 80h n1 n2 n3 n4 n5 n6 d1…dn | Print a PDF-417 barcode | 1D 6B 80 n1 n2 n3 n4 n5 n6 d1…dn |
| GS k NAK d1…d9 NUL | Print an ISBN barcode | 1D 6B 15 d1…d9 00 |
| GS k SYN d1…dn NUL | Print a MSI barcode | 1D 6B 16 d1…dn 00 |
| GS k 82h n d1…dn | Print a MSI barcode | 1D 6B 82 n d1…dn |
| GS k ETB d1…dn NUL | Print a PLESSEY barcode | 1D 6B 17 d1…dn 00 |
| GS k 83h n d1…dn | Print a PLESSEY barcode | 1D 6B 83 n d1…dn |
| GS k 84h n1 n2 | Program barcode left margin | 1D 6B 84 n1 n2 |

## 2.2 ESC/POS® Quick Reference Guide

ESC/POS® is a standard defined by Seiko Epson Corporation. ESC/POS® commands can be classified as
executing or setting. An executing command makes the printer to execute something and does not affect further
incoming data. On the other hand, a setting command makes the printer to change its internal flags that may
affect incoming data.
ESC/POS® commands supported by MP-4200 TH are summarized in Table 11, Table 12 and Table 13.

**Standard commands for ESC/POS® mode**

| Command Classification | GS P |
| --- | --- |

Command         Name
Executing   Setting      function
HT              Horizontal tab                                           x

LF              Print and line feed                                      x

CR              Print and carriage return                                x

DLE EOT         Real-time status transmission                            x

DLE ENQ         Real-time request to printer                             x

Generate pulse at real-time                              x

DLE DC4         Execute power-off sequence                               x

Clear buffer                                             x

ESC SP          Set right-side character spacing                                      x             x

ESC !           Select print mode(s)                                                  x

ESC $           Set absolute print position                              x                          x

ESC ( A         Control beeper tones                                     x            x

ESC *           Select bit-image mode                                    x

ESC -           Turn underline mode on/off                                            x

ESC 2           Select default line spacing                                           x

ESC =           Select peripheral device                                              x

ESC @           Initialize printer                                       x            x

ESC D           Set horizontal tab marks                                              x

ESC E           Turn emphasized mode on/off                                           x

ESC G           Turn double-strike mode on/off                                        x

ESC J           Print and paper feed                                     x                          x

ESC M           Select character font

ESC R           Select an international character set                                 x

ESC V           Turn 90º clockwise rotation mode on/off                               x

ESC \           Set relative print position                              x                          x

ESC a           Select justification                                                  x

ESC c 3         Select paper sensor(s) to output paper-end signals                    x

ESC c 4         Select paper sensor(s) to stop printing                               x

ESC c 5         Enable/disable panel buttons                                          x

ESC d           Print and feed n lines                                   x

ESC i           Perform a partial cut                                    x

ESC m          Partial paper cut                                          x

ESC p          Generate pulse                                             x

ESC t          Select character code table                                            x

ESC u n        Transmit peripheral device status                          x

ESC v          Transmit paper sensor status                               x

ESC {          Turn upside-down printing mode on/off                                  x

FS p           Print NV bit image                                         x

FS q           Define NV bit image                                                    x

GS !           Select character size                                                  x

GS *           Define downloaded bit image                                            x

GS /           Print downloaded bit image                                 x

GS ( A         Execute test print                                         x

GS ( D         Enable/disable real-time command                                       x

GS 8 L                                                                    x
Process graphics data
GS ( L

GS ( N         Select character effects                                               x

GS ( k         Specify and print symbol                                   x           x

GS :           Start/end macro definition                                 x           x

GS B           Turn white/black reverse printing mode on/off                          x

GS H           Select printing position of HRI characters                             x

GS I           Transmit printer ID                                        x

GS L           Set left margin                                                        x           x

GS P           Set horizontal and vertical motion units                               x

GS V           Select cut mode and cut paper                              x                       x

GS W           Set printing area width                                                x           x

GS ^           Execute macro                                              x

GS a           Enable/disable Automatic Status Back (ASB)                 x           x

GS f           Select font for HRI characters                                         x

GS h           Set bar code height                                                    x

GS k           Print bar code                                             x

GS r           Transmit status                                            x

GS v 0         Print raster bit image                                     x

GS w           Set bar code width                                                     x

Notes:- x means command enabled.

MP-4200 TH also supports ideograms for Traditional Chinese (Big-5E), Simplified Chinese (EUC-CN) and
Japanese (JIS or Shift JIS). Table 12 shows MP-4200 TH ESC/POS commands dedicated to ideograms control.

**Ideograms control**

| Command Classification | GS P |
| --- | --- |

Command                        Name
Executing          Setting              function
FS !                           Set print mode(s) for ideograms                                                  x

FS &                           Select ideogram mode                                                             x

FS -                           Turn underline mode on/off for ideograms                                         x

FS .                           Cancel ideogram mode                                                             x

FS C                           Select ideogram code system                                                      x

FS S                           Set ideogram spacing                                                             x                    x

FS W                           Turn quadruple-size mode on/off for ideograms                                    x

Beyond ESC/POS® standard, MP-4200 TH also supports some miscellaneous commands in ESC/POS®
mode to allow printer to be configured independent of current command set (ESC/Bema or ESC/POS®).
The miscellaneous commands supported by MP-4200 TH in ESC/POS® mode are listed in Table 13.

**Special miscellaneous**

| Command | Description | Hexadecimal Format |
| --- | --- | --- |
| GS F9h 5 n | Select printer operating mode and save selected option to configuration memory. | 1D F9 35 n |
| GS F9h 7 n | Set and save printer default code page for ESC/Bema command set. | 1D F9 37 n |
| GS F9h 8 n | Set and save ESC/POS ideogram mode. | 1D F9 38 n |
| GS F9h C 00h | Get printer current command set. | 1D F9 43 00 |
| GS F9h SP n | Select printer operating mode without saving selected option to printer configuration memory. | 1D F9 20 n |
| GS F9h 1Fh 1 | Return to mode in use prior to sending GS F9h SP n command. | 1D F9 1F 31 |
| GS F9h – n | Set and save printer mode | 1D F9 2D n |
| GS F9h ! n | Set and save paper width | 1D F9 21 n |
| GS F9h , n | Enable/disable paper near-end sensor | 1D F9 2C n |
| GS F9h + n | Set and save printing intensity | 1D F9 2B n |
| GS FAh n | Set and save printer language | 1D FA n |
| GS F9h ‘ n | Get printer information | 1D F9 27 n |
| GS F9h ( 0 | Load default user configuration | 1D F9 28 30 |
| GS F9h ) 0 | Print user configuration | 1D F9 29 30 |
| GS F8h 1 | Printer extended status enquiry | 1D F8 31 |
| GS F8h F | Printer reset | 1D F8 46 |
| GS F7h BS NUL “ i1…i4 s1…s4 | Set IP address and subnet mask | 1D F7 08 00 22 i1…i4 s1…s4 |
| GS F7h EOT NUL ‘ g1…g4 | Set default gateway IP address | 1D F7 04 00 27 g1…g4 |
| GS F9h D m n | Activate buzzer on cut | 1D F9 44 m n |
| GS F9h E n | Set DHCP usage | 1D F9 45 n |
| GS F9h S m ip1..ip4 n c1..cn | Set SNMP settings | 1D F9 53  m ip1..ip4 n c1..cn |
| GS F9h W a s c m n e1..em | Set Wi-Fi settings | 1D F9 57 a s c m n e1..em p1..pn |
| p1..pn |  |  |

# Chapter 3: ESC/Bematech Command Set

This chapter presents detailed information about each ESB/Bematech command implemented by the
MP-4200 TH printer.

#### `GS F9h 5 n`

- **Function:** Select printer operating mode.
- **Format:**

  ```
  ASCII  GS F9h 5 n
  Hexadecimal  1D F9 35 n
  Decimal  29 249 53 n
  ```
- **Range:** n = 0; n = 1; n = 48; n = 49;
- **Description:** If n is 0 (00h or 30h), ESC/Bema is selected.  
  If n is 1 (01h or 31h), ESC/POS is selected.
- **Notes:** This command modifies printer flags and save the new values to printer configuration memory.

#### `GS F9h 7 n`

- **Function:** Set and save printer default code page for ESC/Bematech command set.
- **Format:**

  ```
  ASCII  GS F9h 7 n
  Hexadecimal  1D F9 37 n
  Decimal  29 249 55 n
  ```
- **Range:** 2 ≤ n ≤ 12; n = 14; n = 21
- **Default:** n=2
- **Description:** This command selects the code page to be used, according to the following options.
If n is 2 (02h or 32h), CODEPAGE 850 is selected.
If n is 3 (03h or 33h), CODEPAGE 437 is selected.
If n is 4 (04h or 34h), CODEPAGE 860 is selected.
If n is 5 (05h or 35h), CODEPAGE 858 is selected.
If n is 6 (06h or 36h), CODEPAGE 866 is selected.
If n is 7 (07h or 37h), CODEPAGE 864 is selected.
If n is 8 (08h or 38h), UTF8 (Unicode) is selected.
If n is 9 (09h or 39h), Big-5E is selected.
If n is 10 (0Ah or 3Ah), JIS is selected.
If n is 11 (0Bh or 3Bh), SHIFT JIS is selected.
If n is 12 (0Ch or 3Ch), GB2312 is selected.
If n is 14 (0Eh or 3Eh), EUC-CN is selected.
If n is 21 (15h or 45h), CODEPAGE 862 is selected.

#### `GS F9h 8 n`

- **Function:** Set and save ESC/POS ideogram mode.
- **Format:**

  ```
  ASCII  GS F9h 8 n
  Hexadecimal  1D F9 38 n
  Decimal  29 249 56 n
  ```
- **Range:** 0≤n≤3
- **Default:** n=0
- **Description:** If n is 0 (00h or 30h), UTF8 (Unicode) ideogram mode is selected.  
  If n is 1 (01h or 31h), ESC/POS Japanese ideogram mode is selected.  
  If n is 2 (02h or 32h), ESC/POS Simplified Chinese ideogram mode is selected.  
  If n is 3 (03h or 33h), ESC/POS Traditional Chinese ideogram mode is selected.

#### `GS F9h C 00h`

- **Function:** Get printer current command set.
- **Format:**

  ```
  ASCII  GS F9h C 00h
  Hexadecimal  1D F9 43 00
  Decimal  29 249 67 0
  ```
- **Description:** Return one byte with current command set. If returned byte is 0 (00h), printer is operating in  
  ESC/Bema mode. If returned byte is 1 (01h), printer is operating in ESC/POS mode.

#### `GS F9h SP n`

- **Function:** Select printer operating mode of operation temporarily.
- **Format:**

  ```
  ASCII  GS F9h SP n
  Hexadecimal  1D F9 20 n
  Decimal  29 249 32 n
  ```
- **Range:** n = 0; n = 1; n = 48; n = 49;
- **Description:** If n is 0 (00h or 30h), ESC/Bema is selected.  
  If n is 1 (01h or 31h), ESC/POS is selected.
- **Notes:** This command modifies printer flags but does not save the new values to the printer configuration  
  memory. The new mode starts as the printer has been just initialized (ESC @ has been  
  executed).

#### `GS F9h 1Fh 1`

- **Function:** Return to previously set mode of operation.
- **Format:**

  ```
  ASCII  GS F9h 1Fh 1
  Hexadecimal  1D F9 1F 31
  Decimal  29 249 31 49
  ```
- **Description:** Configuration command used to put printer mode back to that used before issuing GS F9h SP n  
  command. The previous mode re-starts as the printer has been just initialized (ESC @ has been  
  executed).

#### `ESC @`

- **Function:** Initialize printer to its default settings.
- **Format:**

  ```
  ASCII  ESC @
  Hexadecimal  1B 40
  Decimal  27 64
  ```
- **Description:** All printer settings, including character font, line spacing, left margin, right margin and inverted  
  mode are canceled and the printer returns to its initial state.

#### `ESC b n`

- **Function:** Select paper sensor to output paper-end signal.
- **Format:**

  ```
  ASCII  ESC b n
  Hexadecimal  1B 62 n
  Decimal  27 98 n
  ```
- **Range:** n = 0, 1, 48, 49
- **Default:** n=0
- **Description:** If n is 0 (00h or 30h), paper-end signal (PE) reflects paper sensor on parallel printers.  
  If n is 1 (01h or 31h), paper-end signal (PE) reflects drawer sensor on parallel printers.
- **Notes:** This command also affects the behavior of ENQ on all printer models.

#### `ESC v n`

- **Function:** Activate drawer #1 for n milliseconds.
- **Format:**

  ```
  ASCII  ESC v n
  Hexadecimal  1B 76 n
  Decimal  27 118 n
  ```
- **Range:** 50 ≤ n ≤ 250
- **Description:** Activate drawer #1 pin for n milliseconds (50ms ≤ n ≤ 200ms).

#### `ESC 80h n`

- **Function:** Activate drawer #2 for n milliseconds.
- **Format:**

  ```
  ASCII  ESC 80h n
  Hexadecimal  1B 80 n
  Decimal  27 128 n
  ```
- **Range:** 50 ≤ n ≤ 250
- **Description:** Activate drawer #2 pin for n milliseconds (50ms ≤ n ≤ 200ms).

#### `ESC i`

- **Function:** Perform full paper cut.
- **Format:**

  ```
  ASCII  ESC i
  Hexadecimal  1B 69
  Decimal  27 105
  ```
- **Description:** This command operates the auto-cutter, performing a full cut in the paper.

#### `ESC w`

- **Function:** Perform full paper cut.
- **Format:**

  ```
  ASCII  ESC w
  Hexadecimal  1B 77
  Decimal  27 119
  ```
- **Description:** This command operates the auto-cutter, performing a full cut in the paper.

#### `ESC y n`

- **Function:** Enable/disable panel keys.
- **Format:**

  ```
  ASCII  ESC y n
  Hexadecimal  1B 79 n
  Decimal  27 121 n
  ```
- **Range:** n = 0, 1
- **Default:** n=1
- **Description:** Enable or disable panel keys.  
  If n is 0 (00h or 30h), panel keys are disabled.  
  If n is 1 (01h or 31h), panel keys are enabled.

#### `ESC x`

- **Function:** Enable dump mode.
- **Format:**

  ```
  ASCII  ESC x
  Hexadecimal  1B 78
  Decimal  27 120
  ```
- **Description:** Dump mode is a function used to print data transmitted from host computer in hexadecimal  
  numbers. This function is to be used by advanced users and programmers in checking commands
sent to the printer.
- **Note:** The only way to exit the dump mode is turning off the printer"

#### `ESC z n`

- **Function:** Enable/disable automatic line feed.
- **Format:**

  ```
  ASCII  ESC z n
  Hexadecimal  1B 7A n
  Decimal  27 122 n
  ```
- **Range:** n = 0, 1
- **Default:** n=0
- **Description:** Enable or disable line feeding.  
  If n is 0 (00h or 30h), automatic line feed is disabled.  
  If n is 1 (01h or 31h), automatic line feed is enabled.
- **Notes:** When automatic line feed is enabled, the printer will perform a LF if a CR is received.

#### `ESC ( A pL pH fn n1 n2 vol`

- **Function:** Activate/deactivate buzzer.
- **Format:**

  ```
  ASCII  ESC ( A pL pH fn n1 n2 vol
  Hexadecimal  1B 28 41 pL pH fn n1 n2 vol
  Decimal  27 40 65 pL pH fn n1 n2 vol
  ```
- **Description:** Activate or deactivate printer buzzer.  
  (pL + pH × 256) = 4, i.e., pL must be 4 and pH must be 0.  
  ƒn = 1 or 31h – activate buzzer.  
  ƒn = 0 or 30h – deactivate buzzer (deprecated).  
  n = (n1 + n2 × 256) – time in milliseconds.  
  vol = 0, 1, 48 or 49 – volume (unused).

#### `GS F9h - n`

- **Function:** Set and save printer mode.
- **Format:**

  ```
  ASCII  GS F9h – n
  Hexadecimal  1D F9 2D n
  Decimal  29 249 45 n
  ```
- **Default:** n=0
- **Description:** Set printer priority to high quality of high speed.  
  n = 0 or 30h – normal.  
  n = 1 or 31h – high quality.  
  n = 2 or 32h – high speed.

#### `GS F9h ! n`

- **Function:** Set and save paper width.
- **Format:**

  ```
  ASCII  GS F9h ! n
  Hexadecimal  1D F9 21 n
  Decimal  29 249 33 n
  ```
- **Description:** Set paper width as described in the table below:

  ```
  n        Paper width (mm)           Printing width (mm)
  00h      58                         48
  ```
01h      76                         72
02h      80                         72
03h      80                         76
04h      82.5                       72
05h      82.5                       76
06h      82.5                       80
- **Notes:** This command has effect only when printer is in ESC/Bema operating mode. For  
  ESC/POS mode paper width is always set to 80mm/73.5mm.

#### `GS F9h , n`

- **Function:** Enable/disable paper near-end sensor.
- **Format:**

  ```
  ASCII  GS F9h , n
  Hexadecimal  1D F9 2C n
  Decimal  29 249 44 n
  ```
- **Default:** n=1
- **Description:** Enable or disable paper near-end sensor (PNES). This setting is saved to  
  configuration (non-volatile) memory.  
  n = 1 or 31h – enable PNES.  
  n = 0 or 30h – disable PNES.

#### `GS F9h + n`

- **Function:** Set and save printing intensity.
- **Format:**

  ```
  ASCII  GS F9h + n
  Hexadecimal  1D F9 2B n
  Decimal  29 249 43 n
  ```
- **Description:** Obsolete and ignored. Kept here to maintain compatibility with earlier Bematech products.

#### `GS FAh n`

- **Function:** Set and save printer language.
- **Format:**

  ```
  ASCII  GS FAh n
  Hexadecimal  1D FA n
  Decimal  29 250 n
  ```
- **Description:** Set printer language.  
  n = 0 or 30h – English  
  n = 1 or 31h – Portuguese  
  n = 2 or 32h – Spanish  
  n = 3 or 33h – German

#### `GS F9h ‘ n`

- **Function:** Get printer information.
- **Format:**

  ```
  ASCII  GS F9h ‘ n
  Hexadecimal  1D F9 27 n
  Decimal  29 249 39 n
  ```
- **Description:** Retrieve printer information according to values described in the following table:

  ```
  n         Information                             Data type      Return size
  0, 30h    Product code (“MP-4200 TH”)             ASCII string   10 bytes
  ```
1, 31h    Serial number                           ASCII string   20 bytes
2, 32h    Manufacturing date                      ASCII string   4 bytes
3, 33h    Firmware version                        ASCII string   3 bytes
4, 34h    Reserved
5, 35h    Manufacturing timestamp (“dd/mm/yy      ASCII string   17 bytes
hh:mm:ss” format)
6, 36h    Reserved
7, 37h    Reserved
8, 38h    Interface type (0 = None; 1 = Serial    Integer        1 byte
DB-9; 2 = Serial DB-25; 3 = Ethernet,
-1 = Unknown)

#### `GS F9h ( 0`

- **Function:** Load default user configuration.
- **Format:**

  ```
  ASCII  GS F9h ( 0
  Hexadecimal  1D F9 28 30
  Decimal  29 249 40 48
  ```
- **Description:** Reload all configurations from non-volatile memory and dipswitches.

#### `GS F9h ) 0`

- **Function:** Print user configuration.
- **Format:**

  ```
  ASCII  GS F9h ) 0
  Hexadecimal  1D F9 29 30
  Decimal  29 249 41 48
  ```
- **Description:** Print on paper the current user configuration.

#### `GS F8h F`

- **Function:** Printer reset.
- **Format:**

  ```
  ASCII  GS F8h F
  Hexadecimal  1D F8 46
  Decimal  29 248 70
  ```
- **Description:** Force a hardware reset on the printer.

#### `GS F7h BS NUL “ i1 ...i4 s1 ...s 4`

- **Function:** Set IP address and subnet mask.
- **Format:**

  ```
  ASCII  GS F7h BS NUL “ i1...i4 s1...s 4
  Hexadecimal  1D F7 08 00 22 i1...i4 s 4...s 4
  Decimal  29 247 8 0 34 i1...i4 s 4...s 4
  ```
- **Description:** Program a fixed IP address and subnet mask to the printer.
- **Example:** To define an IP address of 10.10.1.2 and a subnet mask of 255.255.0.0, the following command  
  should be sent:  
  1D F7 08 00 22 0A 0A 01 02 FF FF 00 00
- **Notes:** Valid only when ethernet or wi-fi interface is being used.

#### `GS F7h EOT NUL ‘ g1…g4`

- **Function:** Set default gateway IP address
- **Format:**

  ```
  ASCII  GS F7h EOT NUL ‘ g1…g4
  Hexadecimal  1D F7 04 00 27 g1…g4
  Decimal  29 247 4 0 39 g1…g4
  ```
- **Default:** 0.0.0.0
- **Description:** This command sets the default gateway IP address, where g1..g4 are the IP address octets.
- **Notes:** Valid only when ethernet or wi-fi interface is being used.
- **Example:** If you want to set the gateway address to 192.168.1.2 the command must be sent as 1D F7 04  
  00 27 C0 A8 01 02

#### `GS F9h D m n`

- **Function:** Activate buzzer on cut
- **Format:**

  ```
  ASCII  GS F9h D m n
  Hexadecimal  1D F9 44 m n
  Decimal  29 249 68 m n
  ```
- **Range:** 0≤m≤2  
  0 ≤ n ≤ 255
- **Default:** m=0  
  n = 200
- **Description:** •  This command tells the printer to active the buzzer at the same time of a cut is being  
  performed.  
  - The buzzer to be activated is defined by m as follow:

  ```
  m         buzzer
  0         none (deactivate previous settings)
  1         internal
  2         external
  •  (n × 100ms) defines the activation time
  ```

#### `GS F9h E n`

- **Function:** Set DHCP usage
- **Format:**

  ```
  ASCII  GS F9h E n
  Hexadecimal  1D F9 45 n
  Decimal  29 249 69 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** This command enables or disables the DHCP client of the printer.  
  - When the LSB of n is 0, the DHCP client is disabled.  
  - When the LSB of n is 1, the DHCP client is enabled.
- **Notes:** Valid only when ethernet or wi-fi interface is being used.

#### `GS F9h S m ip1 ..ip 4 n c1 ..cn`

- **Function:** Set SNMP settings
- **Format:**

  ```
  ASCII  GS F9h S m ip1..ip4 n c1..cn
  Hexadecimal  1D F9 53 m ip1..ip4 n c1..cn
  Decimal  29 249 83 m ip1..ip4 n c1..cn
  ```
- **Range:** 0 ≤ n ≤ 64
- **Default:** m=0  
  n=0
- **Description:** This command sets SNMP trap parameters.  
  - When m = 0, SNMP traps are disabled.  
  - When m ≠ 0, SNMP traps are enabled.  
  - n defines the SNMP community and is limited to 64 bytes.  
  - c1..cn define the community name.
- **Notes:** Valid only when ethernet or wi-fi interface is being used.

#### `GS F9h W a s c m n e1 ..em p1 ..pn`

- **Function:** Set Wi-Fi settings
- **Format:**

  ```
  ASCII  GS F9h W a s c m n e1..em p1..pn
  Hexadecimal  1D F9 57 a s c m n e1..em p1..pn
  Decimal  29 249 87 a s c m n e1..em p1..pn
  ```
- **Range:** a = 0, 1  
  s = 0, 1, 2, 3, 4  
  0 ≤ c ≤ 13  
  0 ≤ m ≤ 32  
  0 ≤ n ≤ 63
- **Default:** a=0  
  s=0  
  c=0  
  m=0  
  n=0
- **Description:** This command sets Wi-Fi communication settings.  
  - a defines the access mode as follow:

  ```
  a         Access mode
  0         Access Point
  1         Ad-hoc
  ```
- s defines the security mode as follow:

  ```
  s         Security mode
  0         No security
  1         WEP 64-bit
  2         WEP 128-bit
  3         WPA-TKIP personal
  4         WPA2-AES personal
  ```

  ```
  •  c defines the channel to use. Use c = 0 when a = 0.
  •  m defines the size of the ESSID.
  •  n defines the size of the passphrase.
  •  e1..em define the ESSID.
  •  p1..pn define the passphrase.
  ```
- **Notes:** Valid only when wi-fi interface is being used.

#### `ESC C n`

- **Function:** Set page size in lines.
- **Format:**

  ```
  ASCII  ESC C n
  Hexadecimal  1B 43 n
  Decimal  27 67 n
  ```
- **Range:** 0 < n < 256
- **Default:** n = 12
- **Description:** Set page size, where n represents the number of single height lines.

#### `ESC c n1 n2`

- **Function:** Set page size in millimeters.
- **Format:**

  ```
  ASCII  ESC c n1 n2
  Hexadecimal  1B 63 n1 n2
  Decimal  27 99 n1 n2
  ```
- **Range:** 0 ≤ n1 ≤ 255  
  0 ≤ n2 ≤ 255
- **Description:** Set page size in millimeters. The page size is calculated by the formula: 0.125mm x [n1 + (256 x n2)].

#### `ESC J n`

- **Function:** Perform fine line feed.
- **Format:**

  ```
  ASCII  ESC J n
  Hexadecimal  1B 4A n
  Decimal  27 74 n
  ```
- **Range:** 48 ≤ n ≤ 255
- **Description:** Perform paper feeding of [(n – 48) x 0,125]mm.
- **Notes:** This command is widely used when printing graphics.

#### `FF`

- **Function:** Feed one page.
- **Format:**

  ```
  ASCII  FF
  Hexadecimal  0C
  Decimal  12
  ```
- **Description:** Performs a form feed, moving from current position to the top of next page.
- **Notes:** This command can be disabled by setting page size to zero.

#### `LF`

- **Function:** Feed one line.
- **Format:**

  ```
  ASCII  LF
  Hexadecimal  0A
  Decimal  10
  ```
- **Description:** Print buffer contents, if any, and perform the feeding of one line according to default line  
  spacing.
- **Notes:** After sending this command, the next character will be printed on the left margin of the next  
  line.

#### `ESC 2`

- **Function:** Set text line height to 1/6 inches.
- **Format:**

  ```
  ASCII  ESC 2
  Hexadecimal  1B 32
  Decimal  27 50
  ```
- **Description:** Set text line height to its default value, which is 1/6 inches.
- **Notes:** 1/6 inches becomes the default line height when printer is turned on or when the ESC @  
  command is issued.

#### `ESC 3 n`

- **Function:** Set line feed to n/144 inches.
- **Format:**

  ```
  ASCII  ESC 3 n
  Hexadecimal  1B 33 n
  Decimal  27 51 n
  ```
- **Range:** 18 ≤ n ≤ 255
- **Description:** The line feed rate per line is specified by n/144 inches.
- **Notes:** This command takes effect immediately.

#### `ESC f 1 n`

- **Function:** Vertical skipping.
- **Format:**

  ```
  ASCII  ESC f 1 n
  Hexadecimal  1B 66 31 n
  Decimal  27 102 49 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Perform vertical skipping of n characters.
- **Notes:** Command 1B 66 01 n  has the same effect.

#### `ESC A n`

- **Function:** Feed paper by [n x 0,375]mm.
- **Format:**

  ```
  ASCII  ESC A n
  Hexadecimal  1B 41 n
  Decimal  27 65 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Perform paper feed of n x 0,375mm.
- **Notes:** If n < 17, the line feed will be equal to zero. For n > 85, the line feed will be equal to 32mm. For  
  other values, the line feed is equal to n x 0,375mm.

#### `ESC f 0 n`

- **Function:** Horizontal skipping.
- **Format:**

  ```
  ASCII  ESC f 0 n
  Hexadecimal  1B 66 30 n
  Decimal  27 102 48 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Performs horizontal skipping of n characters.
- **Notes:** Hex command 1B 66 00 n  takes the same effect.

#### `HT`

- **Function:** Horizontal tab.
- **Format:**

  ```
  ASCII  HT
  Hexadecimal  09
  Decimal  9
  ```
- **Description:** Move print position to next tab mark in the current line.
- **Notes:** Tab marks exist by default at every eight character columns. Default tab mark positions can be  
  modified by the ESC D command.

#### `ESC D n1 ... nk NUL`

- **Function:** Set horizontal tab marks.
- **Format:**

  ```
  ASCII  ESC D n1 ... nk NUL
  Hexadecimal  1B 44 n1 ... nk 00
  Decimal  27 68 n1 ... nk 0
  ```
- **Range:** 1 ≤ n ≤ 255  
  0 ≤ k ≤ 32
- **Default:** The default tab marks are at intervals of 8 characters (columns 9, 17, 25, ...) for font 12x24.
- **Description:** Set horizontal tab marks.  
  - n specifies the column number for setting a horizontal tab position from the beginning of the  line.  
  - k indicates the total number of horizontal tab positions to be set.
- **Notes:** •  The horizontal tab mark is stored as a value of [character width × n], measured from the  
  beginning of the line. The character width includes the right-side character spacing, and  
  double-width characters are set with twice the width of normal characters.  
  - This command cancels previous horizontal tab settings.  
  - When setting n = 8, the print position is moved to column 9 by sending HT.  
  - Up to 32 tab positions (k = 32) can be set. Data exceeding 32 tab positions is processed as  
  normal data.  
  - Transmit [n]k in ascending order and place a NUL code 0 at the end.  
  - When [n]k is less than or equal to the preceding value [n]k-1, tab setting is finished and the  
  following data is processed as normal data.  
  - ESC D NUL cancels all horizontal tab marks.  
  - The previously specified horizontal tab marks do not change, even if character width changes.

#### `ESC Q n`

- **Function:** Set right margin.
- **Format:**

  ```
  ASCII E  SC Q n
  Hexadecimal  1B 51 n
  Decimal  27 81 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Set right margin in number of characters, starting from default left margin.
- **Notes:** If requested right margin is on the left side of current horizontal position, the new margin will  
  become valid only in the next line.

#### `ESC l n`

- **Function:** Set left margin.
- **Format:**

  ```
  ASCII  ESC l n
  Hexadecimal  1B 6C n
  Decimal  27 108 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Set left margin in number of characters, starting from the default left margin.
- **Notes:** If requested left margin is on the right side of current horizontal position, the new margin will  
  become valid only in the next line.

#### `ESC a n`

- **Function:** Character alignment.
- **Format:**

  ```
  ASCII  ESC a n
  Hexadecimal  1B 61 n
  Decimal  27 97 n
  ```
- **Range:** n = 0, 1, 2
- **Default:** n=0
- **Description:** This command set horizontal alignment justification.  
  If n is 0 (00h or 30h), alignment is set to left justified.  
  If n is 1 (01h or 31h), alignment is set to center justified.  
  If n is 2 (02h or 32h), alignment is set to right justified.
- **Notes:** After initialization the default alignment is left justified.

#### `ESC - n`

- **Function:** Enable/disable underline print mode.
- **Format:**

  ```
  ASCII  ESC - n
  Hexadecimal  1B 2D n
  Decimal  27 45 n
  ```
- **Range:** n = 0, 1
- **Default:** n=0
- **Description:** Enable or disable underline print mode.  
  If n is 0 (00h or 30h), underline mode is disabled.  
  If n is 1 (01h or 31h), underline mode is enabled.
- **Notes:** After processing this command, the printer will underline every character or space sent for  
  printing.

#### `ESC 4`

- **Function:** Enable italic print mode.
- **Format:**

  ```
  ASCII  ESC 4
  Hexadecimal  1B 34
  Decimal  27 52
  ```
- **Description:** Enable italic print mode.
- **Notes:** Italic is available in all other print modes.

#### `ESC 5`

- **Function:** Disable italic print mode.
- **Format:**

  ```
  ASCII  ESC 5
  Hexadecimal  1B 35
  Decimal  27 53
  ```
- **Description:** Disable italic print mode.

#### `ESC E`

- **Function:** Enable emphasized print mode.
- **Format:**

  ```
  ASCII  ESC E
  Hexadecimal  1B 45
  Decimal  27 69
  ```
- **Description:** Enable emphasized print mode.
- **Notes:** Emphasized mode is bolder than normal print. Emphasized is available in all other print modes.

#### `ESC F`

- **Function:** Disable emphasized print mode.
- **Format:**

  ```
  ASCII  ESC F
  Hexadecimal  1B 46
  Decimal  27 70
  ```
- **Description:** Disable emphasized print mode.

#### `ESC t n`

- **Function:** Codepage selection.
- **Format:**

  ```
  ASCII  ESC t n
  Hexadecimal  1B 74 n
  Decimal  27 116 n
  ```
- **Range:** 2 ≤ n ≤ 12; n = 14; n = 21
- **Default:** n=2
- **Description:** This command selects the code page to be used, according to the following options.  
  If n is 2 (02h or 32h), CODEPAGE 850 is selected.  
  If n is 3 (03h or 33h), CODEPAGE 437 is selected.  
  If n is 4 (04h or 34h), CODEPAGE 860 is selected.  
  If n is 5 (05h or 35h), CODEPAGE 858 is selected.  
  If n is 6 (06h or 36h), CODEPAGE 866 is selected.  
  If n is 7 (07h or 37h), CODEPAGE 864 is selected.  
  If n is 8 (08h or 38h), UTF8 (Unicode) is selected.  
  If n is 9 (09h or 39h), Big-5E is selected.  
  If n is 10 (0Ah or 3Ah), JIS is selected.  
  If n is 11 (0Bh or 3Bh), SHIFT JIS is selected.  
  If n is 12 (0Ch or 3Ch), GB2312 is selected.
If n is 14 (0Eh or 3Eh), EUC-CN is selected.
If n is 21 (15h or 45h), CODEPAGE 862 is selected.
- **Notes:** CODEPAGE 850 is the default.

#### `ESC R n`

- **Function:** Select an international character set.
- **Format:**

  ```
  ASCII  ESC R n
  Hexadecimal  1B 52 n
  Decimal  27 82 n
  ```
- **Range:** 0 ≤ n ≤ 12
- **Default:** n = 12
- **Description:** This command selects the code page to be used, according to the following options.
If n is 0, CODEPAGE 437 is selected.
If 1 ≤ n ≤ 11, CODEPAGE 858 is selected.
If n is 12, CODEPAGE 850 is selected.
- **Notes:** CODEPAGE 850 is the default. This command is similar to ESC t n. The last command received  
  is effective.

#### `ESC S n`

- **Function:** Enable superscript and/or subscript print mode.
- **Format:**

  ```
  ASCII  ESC S n
  Hexadecimal  1B 53 n
  Decimal  27 83 n
  ```
- **Range:** n = 0, 1
- **Description:** Enable superscript or subscript character mode.  
  If n is 0 (00h or 30h), the superscript is enabled. The next arriving characters will be printed on  
  the upper side of the print line.  
  If n is 1 (01h or 31h), the subscript is enabled. The next arriving characters will be printed on  
  the bottom side of the print line.

#### `ESC T`

- **Function:** Disable superscript and subscript print modes.
- **Format:**

  ```
  ASCII  ESC T
  Hexadecimal  1B 54
  Decimal  27 84
  ```
- **Description:** Disable both superscript and subscript print modes.

#### `ESC N n`

- **Function:** Select printing intensity.
- **Format:**

  ```
  ASCII  ESC N n
  Hexadecimal  1B 4E n
  Decimal  27 78 n
  ```
- **Range:** 0≤n≤4
- **Description:** Obsolete. Kept here to maintain compatibility with earlier Bematech products.

#### `ESC ! n`

- **Function:** Select print mode.
- **Format:**

  ```
  ASCII  ESC ! n
  Hexadecimal  1B 21 n
  Decimal  27 33 n
  ```
- **Description:** Selects the print mode depending on the value of n, as presented in the table below:

  ```
  Value
  Bit                         Function
  0                                 1
  ```
0                           Undefined
1                           Undefined
2                           Undefined
3                           Emphasized                      Clear                             Set
4                           Double height                   Clear                             Set
5                           Double width                    Clear                             Set
6                           Undefined
7                           Underline                       Clear                             Set

#### `ESC } n`

- **Function:** Turn upside-down printing mode on/off.
- **Format:**

  ```
  ASCII  ESC } n
  Hexadecimal  1B 7D n
  Decimal  27 125 n
  ```
- **Range:** n = 0, 1
- **Default:** n=0
- **Description:** Enable or disable upside-down printing mode, in the following conditions:  
  If n is 1 (01h or 31h), upside-down printing mode is enabled.  
  If n is 0 (00h or 30h), upside-down printing mode is disabled.

#### `ESC Z`

- **Function:** Print supported Unicode sets.
- **Format:**

  ```
  ASCII  ESC Z
  Hexadecimal  1B 5A
  Decimal  27 90
  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
  A
  B
  E
  F
  ```

#### `ESC [ n`

- **Function:** Print a specific Unicode set.
- **Format:**

  ```
  ASCII  ESC [ n
  Hexadecimal  1B 5B n
  Decimal  27 91 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Print selected Unicode character set.

#### `DC2`

- **Function:** Disable condensed mode.
- **Format:**

  ```
  ASCII  DC2
  Hexadecimal  12
  Decimal  18
  ```
- **Description:** Disable condensed mode, if previously set by ESC SI or SI command.

#### `DC4`

- **Function:** Disable on-line expanded print.
- **Format:**

  ```
  ASCII  DC4
  Hexadecimal  14
  Decimal  20
  ```
- **Description:** Disable on-line expanded print, if previously set by ESC SO or SO command.

#### `ESC d n`

- **Function:** Enable/disable double height print mode.
- **Format:**

  ```
  ASCII  ESC d n
  Hexadecimal  1B 64 n
  Decimal  27 100 n
  ```
- **Range:** n = 0, 1
- **Default:** n=0
- **Description:** Enable or disable double height print mode, according to the following rules:  
  If n is 0 (00h or 30h), double height is disabled.  
  If n is 1 (01h or 31h), double height is enabled.

#### `ESC H`

- **Function:** Disable condensed mode.
- **Format:**

  ```
  ASCII  ESC H
  Hexadecimal  1B 48
  Decimal  27 72
  ```
- **Description:** This command is the same as DC2 or ESC P.

#### `ESC P`

- **Function:** Disable condensed mode.
- **Format:**

  ```
  ASCII  ESC P
  Hexadecimal  1B 50
  Decimal  27 80
  ```
- **Description:** This command is the same as DC2 or ESC H.

#### `ESC SI`

- **Function:** Enable condensed mode.
- **Format:**

  ```
  ASCII  ESC SI
  Hexadecimal  1B 0F
  Decimal  27 15
  ```
- **Description:** Turn on condensed mode.

#### `ESC SO`

- **Function:** Enable on-line expanded mode.
- **Format:**

  ```
  ASCII  ESC SO
  Hexadecimal  1B 0E
  Decimal  27 14
  ```
- **Description:** If this command is received at the beginning of a line, expanded is valid for the whole line.  
  Otherwise, condensed will be valid only for next incoming characters. In the next line the printer  
  will return to normal mode.

#### `ESC V`

- **Function:** Enable on-line double height mode.
- **Format:**

  ```
  ASCII  ESC V
  Hexadecimal  1B 56
  Decimal  27 86
  ```
- **Description:** If this command is received in the beginning of a line, double height is valid for the whole line.  
  Otherwise, double height will be valid only for next incoming characters. In the next line the  
  printer will return to normal mode.

#### `ESC W n`

- **Function:** Enable/disable expanded mode.
- **Format:**

  ```
  ASCII  ESC W n
  Hexadecimal  1B 57 n
  Decimal  27 87 n
  ```
- **Range:** n = 0, 1
- **Default:** n=0
- **Description:** Set expanded mode (double width).  
  If n is 0 (00h or 30h), expanded mode is disabled.  
  If n is 1 (01h or 31h), expanded mode is enabled.
- **Note:** This command can be sent to the printer at any time, and it will take effect immediately.

#### `SI`

- **Function:** Enable condensed mode.
- **Format:**

  ```
  ASCII  SI
  Hexadecimal  0F
  Decimal  15
  ```
- **Description:** This command is the same as ESC SI.

#### `SO`

- **Function:** Enable on-line expanded mode.
- **Format:**

  ```
  ASCII  SO
  Hexadecimal  0E
  Decimal  14
  ```
- **Description:** This command is the same as ESC SO.

#### `ESC $ n1 n2`

- **Function:** Fill in blank bit columns.
- **Format:**

  ```
  ASCII  ESC $ n1 n2
  Hexadecimal  1B 24 n1 n2
  Decimal  27 36 n1 n2
  ```
- **Description:** This command fills in blank bit columns, from current column until column number (n1+n2*256),  
  where n1+n2*256 should be less than or equal to N. ‘N’ is the printing width, depending on the  
  print mode.

#### `ESC * ! n1 n2 b1 ... bn`

- **Function:** 24-bit graphics.
- **Format:**

  ```
  ASCII  ESC * ! n1 n2 b1 ... b2
  Hexadecimal  1B 2A 21 n1 n2 b1 ... b2
  Decimal  27 42 33 n1 n2 b1 ... b2
  ```
- **Description:** This command downloads a 24-bit bit image with n1+n2*256 columns and b1...bn bytes to  
  compose the image. Each column contains 3 bytes, as shown in the figure below.
1 st bit-column
1 st byte
{                           8th bit-column
{
MSB (bit 7)
2nd byte
LSB (bit 0)
3rd byte
{
This illustration shows a 24-bit graphic containing 8 bit-columns with 3 bytes height each (24
bits). It shows how bytes are interpreted by the printer when this command is used. A full
print line with ‘N’ columns will need N*3 bytes. If the image to print has less than ‘N’ graphic
columns, a LF command must be sent to perform line printing. Text and graphic may be mixed
in the same line.

#### `ESC K n1 n2 b1 ... bn`

- **Function:** 8-bit graphics.
- **Format:**

  ```
  ASCII  ESC K n1 n2 b1 ... b2
  Hexadecimal  1B 4B n1 n2 b1 ... b2
  Decimal  27 75 n1 n2 b1 ... b2
  ```
- **Description:** Select “8 pin” bit image (compatible with dot-matrix printers) where [n1+(n2*256)] is the  
  number of columns, and each column is 1 byte in length. As to fill the line it is necessary to  
  expand this single byte in 3 bytes, 8-bit images are always low resolution. The organization of  
  an eight-bit image is presented in the figure below.
1st bit-column
1 byte
{                                   8th bit-column
MSB (bit 7)
LSB (bit 0)
If the image to print has less than ‘N’ graphic columns, a LF must be sent to perform line
printing. Text and graphic may be mixed in the same line.

#### `FS p n m`

- **Function:** Print non-volatile (NV) bit image.
- **Format:**

  ```
  ASCII  FS p n m
  Hexadecimal  1C 70 n m
  Decimal  28 112 n m
  ```
- **Description:** Print the n-th NV bit image using m print mode.

  ```
  m          Mode            Vertical Dot Density    Horizontal Dot Density
  0, 48      Normal          203 dpi                 203 dpi
  ```
1, 49      Double-width    203 dpi                 101 dpi
2, 50      Double-height   101 dpi                 203 dpi
3, 51      Quadruple       101 dpi                 101 dpi
n is the NV bit image number, as defined by the FS q command.
m is bit image print mode.
This command has no effect when the n-th NV bit image is not defined.

#### `FS q n [xL xH yL yH d1 ... dn]1 ... [xL xH yL yH d1 ... dn] n`

- **Function:** Define NV bit image.
- **Format:**

  ```
  ASCII  FS q n [xL xH yL yH d1 ... dn]1 ... [xL xH yL yH d1 ... dn]n
  Hexadecimal  1C 71 n [xL xH yL yH d1 ... dn]1 ... [xL xH yL yH d1 ... dn]n
  Decimal  28 112 n [xL xH yL yH d1 ... dn]1 ... [xL xH yL yH d1 ... dn]n
  ```
- **Range:** 1 ≤ n ≤ 255  
  0 ≤ xL ≤ 255  
  0 ≤ xH ≤ 3 (when 1 ≤ (xL + xH × 256) ≤ 1023)  
  0 ≤ yL ≤ 255  
  0 ≤ yL ≤ 1 (when 1 ≤ (yL + yH × 256) ≤ 288)  
  0 ≤ d ≤ 255  
  k = (xL + xH × 256) × (yL + yH × 256) × 8
- **Description:** Define n NV bit images to be stored on the non-volatile memory.  
  n specifies the number of NV bit images.  
  xL, xH specifies (xL + xH × 256) × 8 dots in the horizontal direction for the NV bit image.  
  yL, yH specifies (yL + yH × 256) × 8 dots in the vertical direction for the NV bit image.  
  This command erases all NV bit images defined previously and set new ones.

#### `GS / m`

- **Function:** Print downloaded bit image.
- **Format:**

  ```
  ASCII  GS / m
  Hexadecimal  1D 2F m
  Decimal  29 47 m
  ```
- **Description:** Print a downloaded bit image using the mode specified by m.

  ```
  m          Mode            Vertical Dot Density     Horizontal Dot Density
  0, 48      Normal          203 dpi                  203 dpi
  ```
1, 49      Double-width    203 dpi                  101 dpi
2, 50      Double-height   101 dpi                  203 dpi
3, 51      Quadruple       101 dpi                  101 dpi
m is bit image print mode.
This command has no effect when a downloaded bit image has not been defined.

#### `GS * x y d1 ... d (x*y*8)`

- **Function:** Define downloaded bit image.
- **Format:**

  ```
  ASCII  GS * x y d1 ... d(x*y*8)
  Hexadecimal  1D 2A x y d1 ... d(x*y*8)
  Decimal  29 42 x y d1 ... d(x*y*8)
  ```
- **Range:** 1 ≤ x ≤ 255  
  1 ≤ y ≤ 64  
  0 ≤ d ≤ 255
- **Description:** Defines a downloaded bit image using the specified number of dots.  
  (x × 8) defines the number of dots in the horizontal direction.  
  (y × 8) defines the number of dots in the vertical direction.  
  The downloaded bit image is cleared when ESC @ or FS q command is executed, when printer  
  is restarted or when power supply is cycled.  
  The following picture shows the relationship between the downloaded bit image and print data:

#### `GS v 0 m xL xH yL yH d1 ... dk`

- **Function:** Print raster bitmap.
- **Format:**

  ```
  ASCII  GS v 0 m xL xH yL yH d1 ... dk
  Hexadecimal  1D 76 30 m xL xH yL yH d1 ... dk
  Decimal  29 118 48 m xL xH yL yH d1 ... dk
  ```
- **Range:** 0 ≤ m ≤ 3 or 48 ≤ m ≤ 51  
  0 ≤ xL ≤ 255; 0 ≤ xH ≤ 255  
  0 ≤ yL ≤ 255; 0 ≤ yH ≤ 8  
  0 ≤ d ≤ 255  
  k = (xL + xH × 256) × (yL + yH × 256) (k ≠ 0)
- **Description:** Print raster bitmap using the mode defined by m:

  ```
  m        Mode            Vertical Dot Density      Horizontal Dot Density
  0, 48    Normal          203 dpi                   203 dpi
  ```
1, 49    Double-width    203 dpi                   101 dpi
2, 50    Double-height   101 dpi                   203 dpi
3, 51    Quadruple       101 dpi                   101 dpi
xL and xH, define the number of bytes (xL+xH×256) in the horizontal direction for the bit image.
yL and yH define the number of bytes (yL+yH×256) in the vertical direction for the bit image.
Data outside printing area is discarded.
The position at which subsequent characters are printed for raster bit image is specified by HT, ESC $,
ESC \ and GS L.
ESC a is affective on raster bit images.
d indicates bit-image data. Setting a bit to 1 prints a dot and clearing a bit does not print a dot
- **Example:** When printing 640 dots, xL+xH×256 must be 80, as illustrated on following figure:
(XL+XHx256)x8 dots = 640 dots
d1        d2            d3                ...            d78               d79        d80

  ```
  d81      d82           d83                ...        d158                  d159       d160
  (YL+YHx256) dots
  ..         ..             ..             ...             ..                ..         ..
  .          .              .                              .                 .          .
  ```
dK-79    dK-78          dK-77              ...            dK-2              dK-1       dK

  ```
  7      6         5             4     3         2              1      0
  MSB                                                                  LSB
  ```

#### `ENQ`

- **Function:** Printer status enquiry.
- **Format:**

  ```
  ASCII  ENQ
  Hexadecimal  05
  Decimal  05
  ```
- **Description:** Issuing this command, the printer should return a status byte, as defined below:

  ```
  Status bit number            Logic “0”                              Logic “1”
  0                            Printer Off Line                       Printer On Line
  ```
1                            Paper Present                          Paper Out
2*                           Drawer pin low                         Drawer pin high
2**                          Paper Present                          Paper Out
3                            Print head raised                      Print head down
4                            Paper Full                             Paper Near End
5                            Command not executed                   Command executed
6–7                          Unused (always return “0”)
* Refer to drawer user’s manual to know what this value mean.
** Drawer status or paper status on bit number 2 depends on ESC b.

#### `GS F8h 1`

- **Function:** Printer extended status enquiry.
- **Format:**

  ```
  ASCII  GS F8h 1
  Hexadecimal  1D F8 31
  Decimal  29 248 49
  ```
- **Description:** Issuing this command makes the printer to return five status bytes.  
  The first byte is the printer status:  
  7       6–5            4              3              2                1           0
1      BufStat        Wait          Offline         OVR               0           0
Bit 2: OVR (Overrun Error)
0 – Printer is ready to receive data.
1 – Printer is in overrun condition. If more data is
received, it will be lost.
Bit 3: Offline.
0 – Printer is on-line.
1 – Printer is off-line.
Bit 4: Wait.
0 – Printer is printing (busy condition).
1 – Printer buffer is empty, waiting for more data
or commands.
Bit 6 & 5: BufStat - Buffer status.
00 – Printer buffer empty.
01 – Printer buffer is under 1/3 of its capacity.
10 – Printer buffer is above 1/3 of its capacity.
11 – Printer buffer is beyond ¾ of its capacity.
The second byte is the off-line status:
7         6             5     4          3          2     1     0
Cover      Error    NoPaper   Drawer       0          PS   PNES   1
Bit 1: PNES – Paper Near-end Sensor
0 – Paper is not near the end of roll.
1 – Paper is near the end of roll.
Bit 2: PS – Paper sensor
0 – Printer has paper.
1 – Printer has no paper at all.
Bit 4: Drawer
0 – Drawer sensor is in low level (logical 0).
1 – Drawer sensor is in high level (logical 1).
Bit 5: NoPaper
0 – Printer has paper.
1 – Printer has no paper at all.
Bit 6: Error
0 – No error condition exist in the printer.
1 – At least one error condition is being reported by
the printer.
Bit 7: Cover
0 – Printer cover is opened.
1 – Printer cover is closed.
The third byte is printer error status:
7         6             5     4          3          2     1     0
1         RE        NRE       1         CE          CA    0     0
Bit 2: CA – Cutter Absence
0 – Cutter present.
1 – Cutter absent.
Bit 3: CE – Cutter Error
0 – No error condition detected in the cutter.
1 – Cutter error condition detected.
Bit 5: NRE – Non-recoverable Error
0 – NRE condition not detected.
1 – NRE condition detected.
Bit 6: RE – Recoverable Error
0 – RE condition not present.
1 – RE condition present.
The fourth byte is printer head and command set status:
7         6          5          4             3    2         1         0
1        CMD         0          1             0   HOH        0         1
Bit 2: HOH – Head Overheat
0 – Print head has normal temperature.
1 – Print head is overheated.
Bit 6: CMD – Current command set
0 – ESC/Bema command set
1 – ESC/POS command set
The fifth byte is firmware version and revision:
7             6–4               3–0
0      Firmware version   Firmware revision
- **Notes:** This command does not work in a parallel printer using Compatibility Mode.

#### `ETX`

- **Function:** End buffer.
- **Format:**

  ```
  ASCII  ETX
  Hexadecimal  03
  Decimal  3
  ```
- **Description:** The printer will remain in the BUSY state from the moment it receives this command until the  
  print buffer becomes empty. On serial interfaces DTR (RTS) will also remain deactivated while  
  printing is on going.

#### `STX`

- **Function:** Clear buffer.
- **Format:**

  ```
  ASCII  STX
  Hexadecimal  02
  Decimal  2
  ```
- **Description:** This command clears the print buffer without restoring default printer conditions.

#### `CAN`

- **Function:** Cancel last line.
- **Format:**

  ```
  ASCII  CAN
  Hexadecimal  18
  Decimal  24
  ```
- **Description:** This command clears the last line sent to the printer. If data is already dispatched to print head,  
  no action is taken.

#### `DEL`

- **Function:** Cancel last character.
- **Format:**

  ```
  ASCII  DEL
  Hexadecimal  7F
  Decimal  127
  ```
- **Description:** This command clears the last character sent to the printer. If the last character has been already  
  dispatched to print head, no action is taken.

#### `GS h n`

- **Function:** Set barcode height.
- **Format:**

  ```
  ASCII  GS h n
  Hexadecimal  1D 68 n
  Decimal  29 104 n
  ```
- **Range:** 1 ≤ n ≤ 255
- **Default:** n = 162
- **Description:** Barcode height is set to n x 0.125 mm.

#### `GS w n`

- **Function:** Set barcode width.
- **Format:**

  ```
  ASCII  GS w n
  Hexadecimal  1D 77 n
  Decimal  29 119 n
  ```
- **Range:** 2≤n≤4
- **Default:** n=3
- **Description:** This command changes barcode width.  
  n = 2 means normal width.  
  n = 3 means double width.  
  n = 4 means quadruple width.

#### `GS H n`

- **Function:** Choose the position of human readable information (HRI) in the barcode.
- **Format:**

  ```
  ASCII  GS H n
  Hexadecimal  1D 48 n
  Decimal  29 72 n
  ```
- **Range:** 0≤n≤3
- **Default:** n=1
- **Description:** n = 0 means no HRI.  
  n = 1 means HRI on top of barcode.  
  n = 2 means HRI on bottom of barcode.  
  n = 3 means HRI on both top and bottom of barcode.

#### `GS f n`

- **Function:** Set the font to be used for human readable information (HRI).
- **Format:**

  ```
  ASCII  GS f n
  Hexadecimal  1D 66 n
  Decimal  29 102 n
  ```
- **Range:** n = 0, 1, 48 or 49
- **Default:** n=0
- **Description:** n = 0 or n = 48 selects the normal font.  
  n = 1 or n = 49 selects the condensed font.

#### `GS k NUL d1 ... d11 NUL`

- **Function:** Print an UPC-A barcode.
- **Format:**

  ```
  ASCII  GS k NUL d1 ... d11 NUL
  Hexadecimal  1D 6B 00 d1 ... d11 00
  Decimal  29 107 0 d1 ... d11 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…d11 is a sequence of 11 bytes containing barcode information. The checksum digit is added  
  automatically by the printer.

#### `GS k A VT d1 ... d11`

- **Function:** Print an UPC-A barcode.
- **Format:**

  ```
  ASCII  GS k A VT d1 ... d11
  Hexadecimal  1D 6B 41 0B d1 ... d11
  Decimal  29 107 65 11 d1 ... d11
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** This command is a copy of GS k NUL d1…d11 NUL.

#### `GS k SOH d1 ... d6 NUL`

- **Function:** Print an UPC-E barcode.
- **Format:**

  ```
  ASCII  GS k SOH d1 ... d6 NUL
  Hexadecimal  1D 6B 01 d1 ... d6 00
  Decimal  29 107 1 d1 ... d6 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…d6 is a sequence of 6 bytes containing barcode information. The checksum digit is added  
  automatically by the printer.

#### `GS k B ACK d1 ... d6`

- **Function:** Print an UPC-E barcode.
- **Format:**

  ```
  ASCII  GS k B ACK d1 ... d6
  Hexadecimal  1D 6B 42 06 d1 ... d6
  Decimal  29 107 66 6 d1 ... d6
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** This command is a copy of GS k SOH d1…d6 NUL.

#### `GS k STX d1 ... d12 NUL`

- **Function:** Print an EAN-13 barcode.
- **Format:**

  ```
  ASCII  GS k STX d1 ... d12 NUL
  Hexadecimal  1D 6B 02 d1 ... d12 00
  Decimal  29 107 2 d1 ... d12 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…d12 is a sequence of 12 bytes containing barcode information. Printer generates the 13th  
  digit automatically.

#### `GS k C FF d1 ... d12`

- **Function:** Print an EAN-13 barcode.
- **Format:**

  ```
  ASCII  GS k C FF d1 ... d12
  Hexadecimal  1D 6B 43 0C d1 ... d12
  Decimal  29 107 67 12 d1 ... d12
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** This command is a copy of GS k STX d1…d12 NUL.

#### `GS k ETX d1 ... d7 NUL`

- **Function:** Print an EAN-8 barcode.
- **Format:**

  ```
  ASCII  GS k ETX d1 ... d7 NUL
  Hexadecimal  1D 6B 03 d1 ... d7 00
  Decimal  29 107 3 d1 ... d7 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…d7 is a sequence of 7 bytes containing barcode information. Printer generates the 8 th digit  
  automatically.

#### `GS k D BEL d1 ... d7`

- **Function:** Print an EAN-8 barcode.
- **Format:**

  ```
  ASCII  GS k D BEL d1 ... d7
  Hexadecimal  1D 6B 44 07 d1 ... d7
  Decimal  29 107 68 7 d1 ... d7
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** This command is a copy of GS k ETX d1…d7 NUL.

#### `GS k EOT d1 ... dn NUL`

- **Function:** Print a CODE 39 barcode.
- **Format:**

  ```
  ASCII  GS k EOT d1 ... dn NUL
  Hexadecimal  1D 6B 04 d1 ... dn 00
  Decimal  29 107 4 d1 ... dn 0
  ```
- **Range:** d may be 32, 36, 37, 42, 43, 45-57 and 65-90 (uppercase letters).
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The checksum digit is generated  
  automatically by the printer. The number of barcode digits is limited by the physical print width,  
  as well as the programmed barcode width (GS w n).

#### `GS k E n d1 ... dn`

- **Function:** Print a CODE 39 barcode.
- **Format:**

  ```
  ASCII  GS k E n d1 ... dn
  Hexadecimal  1D 6B 45 n d1 ... dn
  Decimal  29 107 69 n d1 ... dn
  ```
- **Description:** This command is a copy of GS k EOT d1…dn NUL.

#### `GS k ENQ d1 ... dn NUL`

- **Function:** Print an ITF barcode.
- **Format:**

  ```
  ASCII  GS k ENQ d1 ... dn NUL
  Hexadecimal  1D 6B 05 d1 ... dn 00
  Decimal  29 107 5 d1 ... dn 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The number of barcode digits is  
  limited by the physical print width, as well as the programmed barcode width (GS w n).

#### `GS k F n d1 ... dn`

- **Function:** Print an ITF barcode.
- **Format:**

  ```
  ASCII  GS k F n d1 ... dn
  Hexadecimal  1D 6B 46 n d1 ... dn
  Decimal  29 107 70 n d1 ... dn
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** This command is a copy of GS k ENQ d1…dn NUL.

#### `GS k ACK d1 ... dn NUL`

- **Function:** Print a CODABAR barcode.
- **Format:**

  ```
  ASCII  GS k ACK d1 ... dn NUL
  Hexadecimal  1D 6B 06 d1 ... dn 00
  Decimal  29 107 6 d1 ... dn 0
  ```
- **Range:** d may be 36, 43, 45-57 and 65-68 (uppercase letters) or 97-100 (lowercase letters). Uppercase  
  and lowercase letters cannot be combined in the same barcode.
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The number of barcode digits  
  is limited by the physical print width, as well as the programmed barcode width (GS w n). If d1  
  is a letter, the last character (dn) must be a letter too.

#### `GS k G n d1 ... dn`

- **Function:** Print a CODABAR barcode.
- **Format:**

  ```
  ASCII  GS k G n d1 ... dn
  Hexadecimal  1D 6B 47 n d1 ... dn
  Decimal  29 107 71 n d1 ... dn
  ```
- **Description:** This command is a copy of GS k ACK d1…dn NUL.

#### `GS k H n d1 ... dn`

- **Function:** Print a CODE 93 barcode.
- **Format:**

  ```
  ASCII  GS k H n d1 ... dn
  Hexadecimal  1D 6B 48 n d1 ... dn
  Decimal  29 107 72 n d1 ... dn
  ```
- **Range:** 0 ≤ dn ≤ 127
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The checksum digit is generated  
  automatically by the printer. The number of barcode digits is limited by the physical print width,  
  as well as the programmed barcode width (GS w n).

#### `GS k I n d1 ... dn`

- **Function:** Print a CODE 128 barcode.
- **Format:**

  ```
  ASCII  GS k I n d1 ... dn
  Hexadecimal  1D 6B 49 n d1 ... dn
  Decimal  29 107 73 n d1 ... dn
  ```
- **Range:** 0 ≤ dn ≤ 127
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The checksum digit is generated  
  automatically by the printer. The number of barcode digits is limited by the physical print width, as  
  well as the programmed barcode width (GS w n).

#### `GS k 80h n1 n2 n 3 n4 n5 n6 d1 ... dn`

- **Function:** Print a PDF-417 barcode.
- **Format:**

  ```
  ASCII  GS k 80h n1 n2 n3 n4 n5 n6 d1 ... dn
  Hexadecimal  1D 6B 80 n1 n2 n3 n4 n5 n6 d1 ... dn
  Decimal  29 107 128 n1 n2 n3 n4 n5 n6 d1 ... dn
  ```
- **Range:** 0 ≤ n1 ≤ 8  
  1 ≤ n2 ≤ 8  
  1 ≤ n3 ≤ 4  
  0 ≤ n4 ≤ 255
- **Description:** n1 is the ECC level.  
  n2 is the pitch height, with height = n2 x 0.125mm.  
  n3 is the pitch width, with width = n 3 x 0.125mm.  
  n4 is the number of codewords per row – if n4 is 0, the maximum number of columns allowed for  
  the pitch width will be used. If the barcode can’t fit the print width the printer automatically  
  adjusts it for the maximum permitted width.  
  n5 and n6 indicate the number of bytes that will be coded, where  
  total = n5 + n6 x 256, and total must be less than 900.  
  d1…dn is the actual sequence of bytes that will be coded.

#### `GS k NAK d1 ... d 9 NUL`

- **Function:** Print an ISBN barcode.
- **Format:**

  ```
  ASCII  GS k NAK d1 ... d9 NUL
  Hexadecimal  1D 6B 15 d1 ... d9 00
  Decimal  29 107 21 d1 ... d9 0
  ```
- **Range:** d may be 45, 48-57 and 88. Uppercase and lowercase letters cannot be combined in the same  
  barcode.
- **Description:** d1…d9 is the sequence of 9 bytes containing the barcode information. If hyphens are included  
  in the information, as in the example below, they will not be computed as a d n byte. After the  
  ninth valid digit, an hyphen can be added followed by an “X” (58h) or any other digit (30h to  
  39h). In this case there are two options:  
  - Send the 00h and the barcode will be printed, or  
  - Send space (20h) and more 5 digits (30h to 39h)  
  Example:            1-56592-292-X 90000  
  1-56592-292-1 90000  
  1-56592-292-X  
  1-56592-292-1

#### `GS k SYN d1 ... dn NUL`

- **Function:** Print a MSI barcode.
- **Format:**

  ```
  ASCII  GS k SYN d1 ... dn NUL
  Hexadecimal  1D 6B 16 d1 ... dn 00
  Decimal  29 107 22 d1 ... dn 0
  ```
- **Range:** 48 ≤ dn ≤ 57
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The checksum digit is generated  
  automatically by the printer. The number of barcode digits is limited by the physical print width,  
  as well as the programmed barcode width (GS w n).

#### `GS k 82h n d1 ... dn`

- **Function:** Print a MSI barcode.
- **Format:**

  ```
  ASCII  GS k 82h n d1 ... dn
  Hexadecimal  1D 6B 82 n d1 ... dn
  Decimal  29 107 130 n d1 ... dn
  ```
- **Description:** This command is a copy of GS k SYN d1…dn NUL.

#### `GS k ETB d1 ... dn NUL`

- **Function:** Print a PLESSEY barcode.
- **Format:**

  ```
  ASCII  GS k ETB d1 ... dn NUL
  Hexadecimal  1D 6B 17 d1 ... dn 00
  Decimal  29 107 23 d1 ... dn 0
  ```
- **Range:** d may be 48-57 plus 65-70 (uppercase letters) or 97-102 (lowercase letters). Uppercase and  
  lowercase letters cannot be combined in the same barcode.
- **Description:** d1…dn is a sequence of n bytes containing barcode information. The checksum digit is generated  
  automatically by the printer. The number of barcode digits is limited by the physical print width,  
  as well as the programmed barcode width (GS w n).

#### `GS k 83h n d1 ... dn`

- **Function:** Print a PLESSEY barcode.
- **Format:**

  ```
  ASCII  GS k 83h n d1 ... dn
  Hexadecimal  1D 6B 83 n d1 ... dn
  Decimal  29 107 131 n d1 ... dn
  ```
- **Description:** This command is a copy of GS k ETB d1…dn NUL.

#### `GS k 84h n1 n2`

- **Function:** Program barcode left margin.
- **Format:**

  ```
  ASCII  GS k 84h n1 n2
  Hexadecimal  1D 6B 84 n1 n2
  Decimal  29 107 132 n1 n2
  ```
- **Description:** Set a left margin for printing barcodes. The margin position is given by [n1 + n2 x 256].

# Chapter 4: ESC/POS® Command Set

This chapter presents detailed information about each ESC/POS® command implemented by the MP-4200
TH printer.

Some terms used in the description of ESC/POS command set need further explanation, as described below.
- Print buffer: a buffer that stores the image data to be printed.
- Print buffer full: the state where the print buffer is full. If new print data is input while the
print buffer is full, the data in the print buffer is printed out and a line feed is executed. This is
the same operation as the LF operation.
- Start of line: a state that satisfies the following conditions:
o Print buffer is empty.
o There is no data to print (including portions of data skipped due to HT).
o  The print position has not been specified by the ESC $ or ESC \ command.
- Printable area: the maximum space available for printing. The printable area under ESC/POS
for MP-4200 TH is specified by horizontal direction (73.6mm {588/203”}).
- Printing area: a value set by the command. It must be always less than or equal to printable
area.
- Ignore: a state in which all codes, including parameters, are read in and discarded, and nothing happens.
- MSB: Most Significant Bit
- LSB: Least Significant Bit

#### `HT`

- **Function:** Horizontal tab.
- **Format:**

  ```
  ASCII  HT
  Hexadecimal  09
  Decimal 9
  ```
- **Description:** Move print position to the next horizontal tab mark.
- **Details:** •  This command is ignored if next horizontal tab mark has not been set.  
  - Horizontal tab marks are set with ESC D.  
  - If this command is received when the printing position is at [printing area width + 1], the  
  printer executes print buffer-full printing of the current line and horizontal tab processing from  
  the beginning of the next line.
- **Reference:** ESC D

#### `LF`

- **Function:** Print and line feed.
- **Format:**

  ```
  ASCII  LF
  Hexadecimal  0A
  Decimal  10
  ```
- **Description:** Print data in the print buffer, if any, and feed one line based on current line spacing.
- **Details:** This command set print position to the beginning of the next line.
- **Reference:** ESC 2, ESC 3

#### `CR`

- **Function:** Print and carriage return.
- **Format:**

  ```
  ASCII  CR
  Hexadecimal  0D
  Decimal  13
  ```
- **Description:** When automatic line feed is enabled, this command functions the same as LF; when automatic  
  line feed is disabled this command is ignored.
- **Details:** •  Set print position to the beginning of the line.  
  - Automatic line feed is ignored with a serial interface model.
- **Reference:** LF

#### `DLE EOT n`

- **Function:** Real-time status transmission.
- **Format:**

  ```
  ASCII  DLE EOT n
  Hexadecimal  10 04 n
  Decimal  16 4 n
  ```
- **Range:** 1≤n≤4
- **Description:** Transmits the selected printer status specified by n in real-time, according to  
  the following parameters:  
  n = 1: Transmit printer status  
  n = 2: Transmit offline status  
  n = 3: Transmit error status  
  n = 4: Transmit paper roll sensor status
- **Details:** •  The printer transmits current status. Each status is represented by one-byte data.  
  - The printer transmits the status without confirming whether the host computer can receive  
  data.  
  - The printer executes this command upon receiving it.  
  - This command is executed even when the printer is offline, the receive buffer is full, or there  
  is an error status with a serial interface model.  
  - With a parallel interface model, this command cannot be executed when the printer is busy.  
  This command is executed even when printer is offline.  
  - When Auto Status Back (ASB) is enabled using the GS a command, the status transmitted by  
  the DLE EOT command and the ASB status must be differentiated.  
  - Even though the printer is not selected using ESC = (select peripheral device), this command  
  is effective.
- **Notes:** •  This command should not be used within a data sequence of another command that consists  
  of 2 or more bytes.

  ```
  n = 1: Printer status
  Bit     On/Off    Hex      Dec    Function
  0       Off      00        0    Not used. Fixed to off.
  ```
1       On       02        2    Not used. Fixed to on.

  ```
  Off      00        0    Drawer open/close signal is LOW (connector pin 3).
  On       04        4    Drawer open/close signal is HIGH (connector pin 3).
  ```

  ```
  Off      00        0    Printer online.
  On       08        8    Printer offline.
  ```
4       On       10       16    Not used. Fixed to on.
5, 6      -           -     -    Undefined.
7       Off      00        0    Not used. Fixed to off.

  ```
  n = 2: Offline status
  Bit     Off/On      Hex        Decimal        Function
  0       Off         00         0              Not used. Fixed to Off.
  ```
1       On          02         2              Not used. Fixed to On.
2       Off         00         0              Cover is closed.
On          04         4              Cover is open.
3       Off         00         0              Paper is not being fed by using the FEED button.
On          08         8              Paper is being fed by the FEED button.
4       On          10         16             Not used. Fixed to On.
5       Off         00         0              No paper-end stop.
On          20         32             Printing is being stopped.
6       Off         00         0              No error.
On          40         64             Error occurs.
7       Off         00         0              Not used. Fixed to Off.

  ```
  Bit 5: Becomes on when paper end sensor detects paper end.
  n = 3: Error status
  Offline status
  Bit     Off/On          Hex        Decimal                        Function
  0         Off        00            0          Not used. Fixed to Off.
  ```
1         On         02            2          Not used. Fixed to On.
2         –           –            –          Undefined

  ```
  Off        00            0          No autocutter error.
  On         08            8          Autocutter error occurs.
  ```
4         On         10           16          Not used. Fixed to On.
5         Off        00            0          No unrecoverable error.
On         20           32          Unrecoverable error occurs.
6         Off        00            0          No auto-recoverable error.
On         40           64          Auto recoverable error occurs.
7         Off        00            0          Not used. Fixed to Off.
Bit 3: If these errors occur due to paper jam, it is possible to recover it by opening cover and
closing it again. If an error due to a circuit failure (e.g. wire break) occurs, it is impossible to
recover.
Bit 6: Becomes on when printing is stopped due to high print head temperature, the printer
remains stopped until the print head temperature drops sufficiently or when the paper roll cover
is open during printing.

  ```
  n = 4: Continuous paper sensor status
  Continuous paper sensor status
  Bit     Off/On    Hex       Decimal          Function
  0     Off       00            0          Not used. Fixed to Off.
  ```
1     On        02            2          Not used. Fixed to On.
2, 3     Off       00            0          Paper roll near-end sensor:
paper adequate.
On        0C           12          Paper near-end is detected by
the paper roll near-end sensor.
4     On        10           16          Not used. Fixed to On.
5, 6     Off       00            0          Paper roll sensor: Paper present.
On        60           96          Paper roll end detected
by paper roll sensor.
7     Off       00            0          Not used. Fixed to Off.
- **References:** DLE ENQ, GS a, GS r

#### `DLE ENQ n`

- **Function:** Real-time request to printer.
- **Format:**

  ```
  ASCII  DLE ENQ n
  Hexadecimal  10 05 n
  Decimal  16 5 n
  ```
- **Range:** 1≤n≤2
- **Description:** Responds to a request from the host computer.  
  n = 1: Recover from an error and restart printing from the line where the error occurred.  
  n = 2: Recover from an error after clearing receive and print buffers.
- **Notes:** Do nothing command. Implemented to adhere to ESC/POS. Auto-cutter error recovery is  
  performed by opening the cover and closing it again.

#### `DLE DC4 fn m t (fn = 1)`

- **Function:** Generate pulse at real-time.
- **Format:**

  ```
  ASCII  DLE DC4 f n m t
  Hexadecimal  10 14 f n m t
  Decimal  16 20 f n m t
  ```
- **Range:** ƒn = 1  
  m = 0, 1  
  1≤t≤8
- **Description:** Outputs the pulse specified by t to connector pin m as follows:

  ```
  m         Connector pin
  0         Drawer kick-out connector pin 2.
  1         Drawer kick-out connector pin 5.
  ```
The pulse ON or OFF time is [t × 100 ms].
- **Details:** •  When the printer is in an error status, this command is ignored.  
  - This command is ignored when an ESC p or a DLE DC4 is being executed in the same output  
  pin.

  ```
  •  The printer executes this command upon receiving it.
  •  This command is executed even when the printer is offline.
  •   This command is effective even when the printer is disabled with ESC = (Select peripheral
  device).
  ```
- **Notes:** •  This can be enabled or disabled by GS ( D command.
- **Reference:** ESC p, GS ( D

#### `DLE DC4 fn a b (fn = 2)`

- **Function:** Execute power-off sequence.
- **Format:**

  ```
  ASCII  DLE DC4 f n m t
  Hexadecimal  10 14 f n m t
  Decimal  16 20 f n m t
  ```
- **Visibility:** Public
- **Range:** ƒn = 2  
  a=1  
  b=8
- **Details:** •  Do nothing command. Implemented to adhere to ESC/POS.

#### `DLE DC4 fn d1 ... d7 (fn = 8)`

- **Function:** Clear buffer.
- **Format:**

  ```
  ASCII  DLE DC4 f n d1 ... d7
  Hexadecimal  10 14 f n d1 ... d7
  Decimal  16 20 f n d1 ... d7
  ```
- **Range:** ƒn = 8  
  d1 = 1; d2 = 3; d 3 = 20; d4 = 1; d5 = 6; d6 = 2; d7 = 8
- **Details:** •  Do nothing command. Implemented to adhere to ESC/POS.

#### `ESC SP n`

- **Function:** Set right-side character spacing.
- **Format:**

  ```
  ASCII  ESC SP n
  Hexadecimal  1B 20 n
  Decimal  27 32 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Set character spacing for the right side of a character to [n × horizontal motion unit].
- **Details:** •   The right-side character spacing for double-width mode is twice the normal value.  
  When characters are enlarged, the right-side character spacing is n times normal value.  
  - This command does not affect the setting of ideograms.  
  - The horizontal motion unit can be specified by GS P. Changing horizontal motion unit does not  
  affect the current right-side spacing.  
  - The GS P command can change horizontal and vertical motion units. However, the value  
  cannot be less than minimum horizontal movement amount, and it must be in even units of  
  minimum horizontal movement amount.  
  - The maximum right-side spacing is 31.91 mm {255/203”}. Any setting exceeding the maximum  
  is converted to the maximum automatically.
- **Reference:** GS P

#### `ESC ! n`

- **Function:** Select print mode(s).
- **Format:**

  ```
  ASCII  ESC ! n
  Hexadecimal  1B 21 n
  Decimal  27 33 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Select print mode(s) using n as follows:  
  Bit        Off/On          Hex          Decimal                 Function  
  Off            00             0       Character font C (14 × 24).  
  On             01             1       Character font D (10.5 × 24).
1            -              -             -       Undefined.
2            -              -             -       Undefined.

  ```
  Off            00             0       Emphasized mode not selected.
  On             08             8       Emphasized mode selected.
  ```

  ```
  Off            00             0       Double-height mode not selected.
  On             10            16       Double-height mode selected.
  ```

  ```
  Off            00             0       Double-width mode not selected.
  On             20            32       Double-width mode selected.
  ```
6            -              -             -       Undefined.

  ```
  Off            00             0       Underline mode not selected.
  On             80            128      Underline mode selected.
  ```
- **Details:** •  When both double-height and double-width modes are selected, quadruple size characters are  
  printed.  
  - The printer can underline all characters, but can not underline the space set by HT or 90°  
  clockwise rotated characters.  
  - The thickness of the underline can be selected by ESC −, regardless of the character size.  
  - When some characters in a line are double or more height, all the characters on the line are  
  aligned at the baseline.  
  - ESC E can also turn on or off emphasized mode. However, the setting of the last received  
  command is effective.  
  - ESC − can also turn on or off underline mode. However, the setting of the last received  
  command is effective.  
  - GS ! can also select character size. However, the setting of the last received command is  
  effective.  
  - Emphasized mode is effective for alphanumeric and ideograms. All print modes except  
  emphasized mode is effective only for alphanumeric.
- **References:** ESC -, ESC E, GS !

#### `ESC $ nL nH`

- **Function:** Set absolute print position.
- **Format:**

  ```
  ASCII  ESC $ nL nH
  Hexadecimal  1B 24 nL nH
  Decimal  27 36 nL nH
  ```
- **Range:** 0 ≤ nL ≤ 255  
  0 ≤ nH ≤ 255
- **Description:** Set the distance from the beginning of the line to the position at which subsequent characters  
  are to be printed.
- The distance from the beginning of the line to the print position is (nL + nH × 256).
- **Details:** •  Setting a value outside printable area is ignored.  
  - The horizontal motion unit is specified by GS P.  
  - The GS P command can change horizontal motion unit. However, the value cannot be less  
  than minimum horizontal movement amount, and it must be in even units of minimum horizontal  
  movement amount.
- **References:** ESC \, GS P

#### `ESC ( A ENQ NUL a d c t1 t 2`

- **Function:** Activate/deactivate buzzer.
- **Format:**

  ```
  ASCII  ESC ( A ENQ NUL a d c t1 t 2
  Hexadecimal  1B 28 41 05 00 61 64 c t1 t 2
  Decimal  27 40 65 5 0 97 100 c t1 t 2
  ```
- **Range:** 0 ≤ c ≤ 63; 0 ≤ t1 ≤ 255; 0 ≤ t 2 ≤ 255
- **Description:** Activates the integrated buzzer.  
  - c specifies the number of beeping cycles.  
  - t1 specifies buzzer on time (t1 × 100 ms) for each cycle.  
  - t 2 specifies buzzer off time (t 2 × 100 ms) for each cycle.

#### `ESC * m nL nH d1 ... dk`

- **Function:** Select bit-image mode.
- **Format:**

  ```
  ASCII  ESC * m nL nH d1 ... dk
  Hexadecimal  1B 2A m nL nH d1 ... dk
  Decimal  27 42 m nL nH d1 ... dk
  ```
- **Range:** m = 0, 1 32, 33  
  0 ≤ nL ≤ 255  
  0 ≤ nH ≤ 255  
  0 ≤ d ≤ 255
- **Description:** Select bit-image mode using m for the number of dots specified by nL and nH, as follows:

  ```
  Vertical Direction   Horizontal Direction
  m      Mode
  Dots                 Dot Density   Dot Density   Data Count (K)
  ```
0      8-dot single-density    8                    68 dpi        101 dpi       nL + nH x256
1      8-dot double-density    8                    68 dpi        203 dpi       nL + nH x 256
32     24-dot single-density   24                   203 dpi       101 dpi       (nL + nH x 256) x 3
33     24-dot double-density   24                   203 dpi       203 dpi       (nL + nH x 256) x 3
- **Details:** •  If m is out of range, nL and the data following it are processed as normal data.  
  - (nL + nH × 256) indicate the number of bit image dots in the horizontal direction.  
  - If bit-image data input exceed the number of dots to be printed on a line, the excess data is  
  ignored.  
  - d indicate bit-image data.  
  - If the width of the printing area set by GS L and GS W is less than the width required by the  
  data sent with the ESC * command, the excess data will be performed on the line in question  
  (but the printing cannot exceed the maximum printable area):  
  o The width of the printing area is extended to the right to accommodate the amount  
  of data.  
  o If previous step does not provide sufficient width for the data, the left margin is  
  reduced to accommodate the data.  
  - After printing a bit image, the printer returns to normal data processing mode.  
  - This command is not affected by print modes (emphasized, double-strike, underline, character  
  size or white/black reverse printing), except upside-down printing mode.

#### `ESC - n`

- **Function:** Turn underline mode on/off.
- **Format:**

  ```
  ASCII  ESC - n
  Hexadecimal  1B 2D n
  Decimal  27 45 n
  ```
- **Range:** 0 ≤ n ≤2, 48 ≤ n ≤ 50
- **Default:** n=0
- **Description:** Turn underline mode on or off, based on the following values of n:

  ```
  n            Function
  0, 48        Turn off underline mode.
  ```
1, 49        Turn on underline mode (1-dot thick).
2, 50        Turn on underline mode (2-dot thick).
- **Details:** •  The printer can underline all characters (including right-side character spacing), but cannot  
  underline the space set by HT.  
  - The printer cannot underline 90° clockwise rotated characters and white/black inverted  
  characters.  
  - When underline mode is turned off by setting the value of n to 0 or 48, the following data is  
  not underlined, and the underline thickness set before the mode is turned off does not change.  
  The default underline thickness is 1 dot.  
  - Changing character size does not affect the current underline thickness.  
  - Underline mode can also be turned on or off by using ESC !. Note, however, that the last  
  received command is effective.  
  - This command does not affect ideogram printing.
- **Reference:** ESC !

#### `ESC 2`

- **Function:** Select default line spacing.
- **Format:**

  ```
  ASCII  ESC 2
  Hexadecimal  1B 32
  Decimal  27 50
  ```
- **Description:** Select approximately 4.23 mm {1/6”} of line spacing.
- **Reference:** ESC 3

#### `ESC = n`

- **Function:** Select peripheral device.
- **Format:**

  ```
  ASCII  ESC = n
  Hexadecimal  1B 3D n
  Decimal  27 61 n
  ```
- **Range:** 1 ≤ n ≤ 255
- **Default:** n=1
- **Description:** Select device to send data from the host computer, using n as follows:

  ```
  Bit      On/Off          Hex            Decimal      Function
  0        Off             00             0            Printer disabled.
  ```
On              01             1            Printer enabled.
1-7      -               -              -            Undefined.
- **Details:** When printer is disabled, it ignores all data except those commands used for error-recovery  
  commands (DLE EOT, DLE ENQ, DLE DC4).

#### `ESC @`

- **Function:** Initialize printer.
- **Format:**

  ```
  ASCII  ESC @
  Hexadecimal  1B 40
  Decimal  27 64
  ```
- **Description:** Clear data in the print buffer and reset printer mode to that was in effect when power was turned on.
- **Details:** •  DIP switch settings are not checked again.  
  - Data in the receive buffer is not cleared.  
  - Macro definition is not cleared.  
  - NV bit image data is not cleared.  
  - Data on NV user memory is not cleared.

#### `ESC D n1 ... nk NUL`

- **Function:** Set horizontal tab marks.
- **Format:**

  ```
  ASCII  ESC D n1 ... nk NUL
  Hexadecimal  1B 44 n1 ... nk 00
  Decimal  27 68 n1 ... nk 0
  ```
- **Range:** 1 ≤ n ≤ 255  
  0 ≤ k ≤ 32
- **Default:** The default tab marks are at intervals of 8 characters (columns 9, 17, 25, ...) for font 14x24.
- **Description:** Set horizontal tab marks.  
  - n specifies the column number for setting a horizontal tab position from the beginning of the  
  line.  
  - k indicates the total number of horizontal tab positions to be set.
- **Details:** • The horizontal tab mark is stored as a value of [character width × n], measured from the  
  beginning of the line. The character width includes the right-side character spacing, and double-  
  width characters are set with twice the width of normal characters.  
  - This command cancels previous horizontal tab settings.  
  - When setting n = 8, the print position is moved to column 9 by sending HT.  
  - Up to 32 tab positions (k = 32) can be set. Data exceeding 32 tab positions is processed as  
  normal data.  
  - Transmit [n]k in ascending order and place a NUL code 0 at the end.  
  - When [n]k is less than or equal to the preceding value [n]k-1, tab setting is finished and the  
  following data is processed as normal data.  
  - ESC D NUL cancels all horizontal tab marks.  
  - The previously specified horizontal tab marks do not change, even if character width changes.
- **Reference:** HT

#### `ESC E n`

- **Function:** Turn emphasized mode on/off.
- **Format:**

  ```
  ASCII  ESC E n
  Hexadecimal  1B 45 n
  Decimal  27 69 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Turn emphasized mode on or off.  
  - When the LSB of n is 0, emphasized mode is turned off.
- When the LSB of n is 1, emphasized mode is turned on.
- **Details:** •  Only the least significant bit of n is used.  
  - This command and ESC ! turn on and off emphasized mode in the same way.
- **Reference:** ESC !

#### `ESC G n`

- **Function:** Turn on/off double-strike mode.
- **Format:**

  ```
  ASCII  ESC G n
  Hexadecimal  1B 47 n
  Decimal  27 71 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Turn double-strike mode on or off.  
  - When the LSB of n is 0, double-strike mode is turned off.  
  - When the LSB of n is 1, double-strike mode is turned on.
- **Details:** •  Only the least significant bit of n is used.  
  - Printer output is the same in double-strike mode and in emphasized mode.
- **Reference:** ESC E

#### `ESC J n`

- **Function:** Print and feed paper.
- **Format:**

  ```
  ASCII  ESC J n
  Hexadecimal  1B 4A n
  Decimal  27 74 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Print data in the print buffer and feed paper [n × vertical motion unit].
- **Details:** •  After printing, this command sets the print position to the beginning of the line.  
  - The paper feed amount set by this command does not affect the values set by ESC 2 or ESC 3.  
  - Vertical motion unit can be specified by GS P.  
  - The GS P command can change vertical motion unit. However, the value cannot be less than  
  the minimum vertical movement amount, and it must be set in even units of minimum vertical  
  movement amount.  
  - The maximum line spacing is 1016mm {40”}. When the setting value exceeds the maximum,  
  it is converted to the maximum automatically.
- **Reference:** GS P

#### `ESC M n`

- **Function:** Select character font.
- **Format:**

  ```
  ASCII  ESC M n
  Hexadecimal  1B 4D n
  Decimal  27 77 n
  ```
- **Range:** n = 0, 1, 48, 49
- **Description:** Select a character font.

  ```
  n           Function
  0, 48       Character font C (14 x 24) selected.
  ```
1, 49       Character font D (10.5 x 24) selected.
- **Details:** ESC ! command can also select a character font. The setting of the last received command is  
  effect.
- **Reference:** ESC !

#### `ESC R n`

- **Function:** Select an international character set.
- **Format:**

  ```
  ASCII  ESC R n
  Hexadecimal  1B 52 n
  Decimal  27 82 n
  ```
- **Range:** 0 ≤ n ≤ 12
- **Default:** n≤0
- **Description:** Selects an international character set n from the following table.

  ```
  n           Character Set
  0           U.S.A. (Codepage 437)
  ```
1 - 11      International (Codepage 858)
12          Latin America (Codepage 850)

#### `ESC V n`

- **Function:** Turn 90º clockwise rotation mode on/off.
- **Format:**

  ```
  ASCII  ESC V n
  Hexadecimal  1B 56 n
  Decimal  27 86 n
  ```
- **Range:** n = 0, 1, 48, 49
- **Default:** n=0
- **Description:** Turn 90º clockwise rotation mode on or off. n is used as follows:

  ```
  n           Function
  0, 48       Turn off 90º clockwise rotation mode.
  ```
1, 49       Turn on 90º clockwise rotation mode.
- **Details:** •   Even when underline mode is turned on, the printer does not underline characters 90º  
  clockwise-rotated.  
  - Double-width and double-height commands in 90º rotation mode enlarge characters in the  
  opposite directions from double-height and double-width commands in normal mode.
- **References:** ESC !, ESC -

#### `ESC \ nL nH`

- **Function:** Set relative print position.
- **Format:**

  ```
  ASCII  ESC \ nL nH
  Hexadecimal  1B 5C nL nH
  Decimal  27 92 nL nH
  ```
- **Range:** 0 ≤nL ≤ 255  
  0 ≤ nH ≤ 255
- **Description:** Sets the print starting position based on current position by using the horizontal motion unit.  
  - This command set the distance from the current position to [(nL + nH × 256) × horizontal  
  motion unit].
- **Details:** •  Any setting that exceeds printable area is ignored.  
  - When pitch N is specified to the right:  
  nL+ nH × 256 = N  
  - When pitch N is specified to the left:  
  nL+ nH × 256 = 65536 – N

  ```
  •  The print starting position moves from current position to [N × horizontal motion unit].
  •  The horizontal motion unit can be specified by GS P.
  •  The GS P command can change the horizontal motion unit. However, the value cannot be less
  than the minimum horizontal movement amount, and it must set be in even units of the minimum
  horizontal movement amount.
  ```
- **References:** ESC $, GS P

#### `ESC a n`

- **Function:** Select justification.
- **Format:**

  ```
  ASCII  ESC a n
  Hexadecimal  1B 61 n
  Decimal  27 97 n
  ```
- **Range:** 0 ≤ n ≤ 2; 48 ≤ n ≤ 50
- **Default:** n=0
- **Description:** Align data in one line to the specified position. n selects the justification as follows:

  ```
  n               Justification
  0, 48           Left justification.
  ```
1, 49           Centering.
2, 50           Right justification.
- **Details:** •  The command is enabled only when processed at the beginning of a line.  
  - This command executes justification in the printing area.  
  - This command justifies the space area according to HT, ESC $ or ESC \.

#### `ESC c 3 n`

- **Function:** Select paper sensor(s) to output paper end signals.
- **Format:**

  ```
  ASCII  ESC c 3 n
  Hexadecimal  1B 63 33 n
  Decimal  27 99 51 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n = 15
- **Description:** Selects the paper sensor(s) to output paper end signals, using each bit of n as follows:

  ```
  Bit     Off/On               Hex       Decimal   Function
  Off                00          0      Paper roll near-end sensor disabled
  On                 01          1      Paper roll near-end sensor enabled
  ```

  ```
  Off                00          0      Paper roll near-end sensor disabled
  On                 02          2      Paper roll near-end sensor enabled
  ```

  ```
  Off                00          0      Paper roll end sensor disabled
  On                 04          4      Paper roll end sensor enabled
  ```

  ```
  Off                00          0      Paper roll end sensor disabled
  On                 08          8      Paper roll end sensor enabled
  ```
4-7        -                  -          -      Undefined
- **Details:** •  It is possible to select multiple sensors to output signal. Then, if any of the sensors detects a paper  
  end, the paper end signal is output.  
  - The command is available only with a parallel interface printer, and it is ignored with other

  ```
  interfaces.
  •  Sensor is switched during command execution. The paper end signal switching may be delayed
  depending on the receive buffer state.
  •  If either bit 0 or bit 1 is on, the paper roll near-end sensor is selected as the paper sensor
  outputting paper-end signals.
  •  If either bit 2 or bit 3 is on, the paper roll end sensor is selected as the paper sensor outputting
  paper-end signals.
  •  When both sensors are disabled, the paper end signal always outputs a paper present status.
  ```

#### `ESC c 4 n`

- **Function:** Select paper sensor(s) to stop printing.
- **Format:**

  ```
  ASCII  ESC c 4 n
  Hexadecimal  1B 63 34 n
  Decimal  27 99 52 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Select paper sensor(s) used to stop printing when a paper-end is detected, using n as follows:

  ```
  Bit     Off/On        Hex        Decimal      Function
  Off          00           0        Paper roll near-end sensor disabled.
  On           01           1        Paper roll near-end sensor enabled.
  ```

  ```
  Off          00           0        Paper roll near-end sensor disabled.
  On           02           2        Paper roll near-end sensor enabled.
  ```
2-7         -           -            -        Undefined.
- **Details:** •   When a paper sensor is enabled with this command, printing is stopped only when the  
  corresponding paper is selected for printing.  
  - When a paper-end is detected by the sensor, the printer goes offline and stops printing.  
  - When either bit 0 or 1 is on, the printer selects the paper roll near-end sensor for the paper  
  sensor to stop printing.

#### `ESC c 5 n`

- **Function:** Enable/disable panel buttons.
- **Format:**

  ```
  ASCII  ESC c 5 n
  Hexadecimal  1B 63 35 n
  Decimal  27 99 53 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Enable or disable panel buttons.  
  - When the LSB of n is 0, panel buttons are enabled.  
  - When the LSB of n is 1, panel buttons are disabled.
- **Details:** •  Only the least significant bit of n is used.  
  - When panel buttons are disabled, none of them are usable when the printer cover is closed.  
  - The panel buttons are FEED and CUT.  
  - In the macro ready mode, the FEED button is enabled regardless of the settings of this  
  command; however, the paper cannot be fed by using this button.

#### `ESC d n`

- **Function:** Print and feed n lines.
- **Format:**

  ```
  ASCII  ESC d n
  Hexadecimal  1B 64 n
  Decimal  27 100 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Print data available in the print buffer and feed n lines.
- **Details:** •  This command sets the print starting position to the beginning of the line.  
  - This command does not affect the line spacing set by ESC 2 or ESC 3.  
  - The maximum paper feed amount is 1016 mm {40”}. If the paper feed amount (n × line  
  spacing) of more than 1016 mm {40”} is specified, the printer feeds the paper only 1016 mm  
  {40”}.
- **References:** ESC 2, ESC 3

#### `ESC i`

- **Function:** Perform partial paper cut.
- **Format:**

  ```
  ASCII  ESC i
  Hexadecimal  1B 69
  Decimal  27 105
  ```
- **Description:** Performs a partial cut of the roll paper.

#### `ESC m`

- **Function:** Perform partial paper cut.
- **Format:**

  ```
  ASCII  ESC m
  Hexadecimal  1B 6D
  Decimal  27 109
  ```
- **Description:** This command operates the auto-cutter, performing a partial cut in the paper.

#### `ESC p m t1 t 2`

- **Function:** Generate pulse.
- **Format:**

  ```
  ASCII  ESC p m t1 t 2
  Hexadecimal  1B 70 m t1 t 2
  Decimal  27 112 m t1 t 2
  ```
- **Range:** m = 0, 1, 48, 49  
  0 ≤ t1 ≤ 255  
  0 ≤ t 2 ≤ 255
- **Description:** Outputs the pulse specified by t1 and t 2 to connector pin m as follows:

  ```
  m     Connector pin
  0     Drawer kick-out connector pin 2.
  ```
1     Drawer kick-out connector pin 5.
- **Details:** •  The pulse ON time is [t1 × 2 ms] and the OFF time is [t2 × 2 ms].  
  - If t 2 < t1, the OFF time is [t1 × 2 ms]
- **Reference:** DLE DC4

#### `ESC t n`

- **Function:** Select character code table.
- **Format:**

  ```
  ASCII  ESC t n
  Hexadecimal  1B 74 n
  Decimal  27 116 n
  ```
- **Range:** n = 0, 2, 3, 17, 19, 22
- **Default:** n=2
- **Description:** Selects a page n from the character code table.

  ```
  n    Connector pin
  0    PC437 [U.S.A. and Standard Europe]
  ```
2    PC850 [Multilingual]
3    PC860 [Portuguese]
17   PC866 [Cyrillic]
19   PC858 [Multilingual with Euro symbol]
22   PC864 [Arabic]

#### `ESC u n`

- **Function:** Transmit peripheral device status
- **Format:**

  ```
  ASCII  ESC u n
  Hexadecimal  1B 75 n
  Decimal  27 117 n
  ```
- **Range:** n = 0, 48
- **Description:** Transmits the peripheral device status as 1 byte of data.  
  - The peripheral device status to be transmitted is as follows:

  ```
  Bit        Bin     Hex    Dec     Status
  0          0       00     0       Drawer kick-out connector pin 3 is LOW.
  1       01     1       Drawer kick-out connector pin 3 is HIGH.
  1-3        -       -      -       Undefined.
  4          0       00     0       Not used. Fixed to Off.
  5,6        -       -      -       Undefined.
  7          0       00     0       Not used. Fixed to Off.
  ```

#### `ESC v`

- **Function:** Transmit paper sensor status
- **Format:**

  ```
  ASCII  ESC v
  Hexadecimal  1B 76
  Decimal  27 118
  ```
- **Description:** Transmits the status of paper sensor(s) as 1 byte of data.  
  - The paper sensor status to be transmitted is as follows:  
  Bit        Bin     Hex    Dec     Status  
  0,1        00      00     0       Roll paper near-end sensor: paper adequate.  
  11      03     3       Roll paper near-end sensor: paper near end.  
  2,3        00      00     0       Roll paper end sensor: paper present.  
  11      OC     12      Roll paper end sensor: paper not present.  
  4          00      00     0       Not used. Fixed to Off.  
  5,6        -       -      -       Undefined.  
  7          0       00     0       Not used. Fixed to Off.

#### `ESC { n`

- **Function:** Turn upside-down print mode on/off.
- **Format:**

  ```
  ASCII  ESC { n
  Hexadecimal  1B 7B n
  Decimal  27 123 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Turn upside-down print mode on/off.  
  - When the LSB of n is 0, upside-down mode is turned off.  
  - When the LSB of n is 1, upside-down mode is turned on.
- **Details:** •  Only the least significant bit of n is valid.  
  - This command is enabled only when processed at the beginning of a line.  
  - In upside-down printing mode, the printer rotates the line to be printed by 180° and then prints it.

#### `FS p n m`

- **Function:** Print NV bit image.
- **Format:**

  ```
  ASCII  FS p n m
  Hexadecimal  1C 70 n m
  Decimal  28 112 n m
  ```
- **Range:** 1 ≤ n ≤ 255; 0 ≤ m ≤ 3, 48 ≤ m ≤ 51
- **Description:** Print n-th NV bit image using mode specified by m.

  ```
  m        Mode            Vertical Dot        Horizontal
  Density             Dot Density
  0, 48    Normal          203 dpi             203 dpi
  ```
1, 49    Double-width    203 dpi             101 dpi
2, 50    Double-height   101 dpi             203 dpi
3, 51    Quadruple       101 dpi             101 dpi

  ```
  •  n is the number of the NV bit image to print, as defined by FS q command.
  •  m specifies the bit image mode.
  ```
- **Details:** •  NV bit image means a bit image stored in NV memory by FS q.  
  - This command is not effective when the specified NV bit image has not been defined.  
  - This command is effective only when there is no data in the print buffer.  
  - This command is not affected by print modes (emphasized, double-strike, underline, character  
  size, white/black reverse printing, or 90° rotated characters, etc.), except upside-down printing  
  mode.  
  - If the printable area width set by GS L and GS W for the NV bit image is less than one vertical  
  line, the following processing is performed only on the line in question. However, in NV bit image  
  mode, one vertical line means 1 dot in normal mode (m=0, 48) and in double-height mode (m=2,  
  50), and it means 2 dots in double-width mode (m=1, 49) and in quadruple mode (m=3, 51).  
  o The printing area width is extended to the right in NV bit image mode up to one line  
  vertically. In this case, printing does not exceed the printable area.  
  o If printing area width cannot be extended vertically by one line, the left margin is  
  reduced to accommodate one line vertically.  
  - If downloaded bit-image exceeds one line, the excess data is not printed.  
  - This command feeds dots (for the height n of the NV bit-image) in normal and double-width  
  modes, and (for the height n × 2 of the NV bit-image) in double-height and quadruple modes,  
  regardless of the line spacing specified by ESC 2 or ESC 3.  
  - After printing the bit image, this command sets the print position to the beginning of the next  
  line and processes the data that follows as normal data.
- **References:** ESC *, FS q, GS /, GS v 0

#### `FS q n [xL xH yL yH d1 ...dk]1...[xL xH yL yH d1 ...dk] n`

- **Function:** Define NV bit image.
- **Format:**

  ```
  ASCII  FS q n [xL xH yL yH d1...dk ]1 … [xL xH yL yH d1...dk ]n
  Hexadecimal  1C 71 n [xL xH yL yH d1...dk ]1 … [xL xH yL yH d1...dk ]n
  Decimal  28 113 n [xL xH yL yH d1...dk ]1 … [xL xH yL yH d1...dk ]n
  ```
- **Range:** 1 ≤ n ≤ 255; 0 ≤ xL ≤ 255; 0 ≤ xH ≤ 3 (when 1 ≤ [xL + xH ... 256] ≤ 1023)  
  0 ≤ yL ≤ 255; 0 ≤ yH ≤ 1 (when 1 ≤ [yL + yH × 256] ≤ 288)  
  k = [xL + xH × 256] × [xL + xH × 256] × 8  
  Total defined data area = 2M bits (256K bytes)
- **Description:** Define the NV bit image specified by n.  
  - n specifies the number of the defined NV bit image.

  ```
  •  xL, xH specifies (xL + xH × 256) × 8 dots in the horizontal direction.
  •  yL, yH specifies (xL + xH × 256) × 8 dots in the vertical direction.
  ```
- **Details:** •  This command cancels all NV bit images that have already been defined.  
  - The printer cannot redefine only one of several data definitions previously defined. In this  
  case, all data needs to be sent again.  
  - NV bit image means a bit image which is defined in a non-volatile memory by FS q and printed  
  by FS p.  
  - This command is effective only when processed at the beginning of the line.  
  - This command is effective when at least 7 bytes <FS~yH> are processed with normal  
  values.  
  - In the first group of NV bit images if xL, xH, yL, yH is out of range, this command is disabled.  
  - After processing the first bit image, if there are other images with xL, xH, yL, yH out of range,  
  the printer stops processing this command and starts writing already received images to NV  
  memory.  
  - The d is data to be printed.  
  - This command defines n as the number of a NV bit image. Numbers should rise in order,  
  starting from 1. Therefore, the first data group [xL xH yL yH d1...dk ] is NV bit image 1, and the last  
  data group [xL xH yL yH d1...dk ] is NV bit image n. The total number of bit images should agree  
  with number of NV bit images specified by command FS p.  
  - A data definition in NV bit image consists of [xL xH yL yH d1...dk ]. Therefore, when only one NV  
  bit image is being defined (n=1) the printer processes a data group [xL xH yL yH d1...dk ] once.  
  - When this command is received during macro definition, the printer ends macro definition,  
  and begins executing this command.  
  - Once a NV bit image is defined, it is not erased by performing ESC @, reset, or power off.
- **Reference:** FS p

#### `GS ! n`

- **Function:** Select a character size.
- **Format:**

  ```
  ASCII  GS ! n
  Hexadecimal  1D 21 n
  Decimal  29 33 n
  ```
- **Range:** 0 ≤ n ≤ 255  
  (1 ≤ vertical number of times ≤ 8,  1 ≤ horizontal number of times ≤ 8)
- **Default:** n=0
- **Description:** Select character height using bits 0 to 3 and selects character width using bits 4 to 7, as  
  follows:
Bit     Off/On        Hex             Decimal   Function
Character height selection.
Character width selection.

  ```
  Hex      Decimal      Width
  00       0            1 (normal)
  ```
10       16           2 (double-width)
20       32           3
30       48           4
40       64           5
50       80           6
60       96           7
70       112          8

  ```
  Hex      Decimal      Height
  00       0            1 (normal)
  ```
01       1            2 (double-height)
02       2            3
03       3            4
04       4            5
05       5            6
06       6            7
07       7            8
- **Details:** •  This command is effective on all characters (alphanumeric and ideograms), except on HRI  
  characters.  
  - If n is out of range, command is ignored.  
  - Vertical direction is the paper feed direction, and the horizontal direction is perpendicular  
  to the paper feed direction. However, when character orientation changes for 90° clockwise-  
  rotation mode, the relationship between vertical and horizontal directions is reversed.  
  - When characters are enlarged with different sizes on one line, all the characters on the line  
  are aligned at the baseline.  
  - The ESC ! command can also turn double-width and double-height modes on or off. However,  
  the setting of the last received command is effective.
- **Reference:** ESC !

#### `GS * x y d1 ... d (x×y×8)`

- **Function:** Define downloaded bit image.
- **Format:**

  ```
  ASCII  GS * x y d1 ... d(x×y×8)
  Hexadecimal  1D 2A x y d1 ... d(x×y×8)
  Decimal  29 42 x y d1 ... d(x×y×8)
  ```
- **Range:** 1 ≤ x ≤ 255  
  1 ≤ y ≤ 48  
  x × y ≤ 1536  
  0 ≤ d ≤ 255
- **Description:** Defines a downloaded bit image using the number of dots specified by x and y:  
  - x specifies the number of dots in the horizontal direction.  
  - y specifies the number of dots in the vertical direction.
- **Details:** •  The number of dots in the horizontal direction is x × 8, and in the vertical direction is y × 8.  
  - If x × y is out of range, this command is disabled.  
  - d indicates bit-image data. If a bit in data (d) is set, it will be printed, while if is cleared, the  
  bit will not be printed.
- The downloaded bit image definition is cleared when:
o ESC @ is executed.
o FS q is executed.
o Printer is reset or the power is turned off.
- The following figure shows the relationship between downloaded bit image and print data:
Reference]      GS /

#### `GS / m`

- **Function:** Print downloaded bit image.
- **Format:**

  ```
  ASCII  GS / m
  Hexadecimal  1D 2F m
  Decimal  29 47 m
  ```
- **Range:** 0 ≤ m ≤ 3, 48 ≤ m ≤ 51
- **Description:** Print downloaded bit image using the mode specified by m.

  ```
  m           Mode                     Vertical Dot Density      Horizontal Dot Density
  0, 48       Normal                   203 dpi                   203 dpi
  ```
1, 49       Double-width             203 dpi                   101 dpi
2, 50       Double-height            101 dpi                   203 dpi
3, 51       Quadruple                101 dpi                   101 dpi
- **Details:** •  This command is ignored if a downloaded bit image has not been defined.  
  - This command is effective only when there is no data in the print buffer.  
  - This command has no effect in print modes (emphasized, double-strike, underline, character  
  size, or white/black reverse printing), except for upside-down printing mode.  
  - If downloaded bit-image exceeds the printable area, the excess data is not printed.  
  - If the printing area width set by GS L and GS W is less than one line in vertical, the following  
  processing is performed only on the line in question:  
  o The printing area width is extended to the right up to one line in vertical. In this case,  
  printing does not exceed the printable area.  
  o If the printing area width cannot be extended by one line in vertical, the left margin  
  is reduced to accommodate one line in vertical.
- **Reference:** GS *

#### `GS ( A pL pH n m`

- **Function:** Execute test print.
- **Format:**

  ```
  ASCII  GS ( A pL pH n m
  Hexadecimal  1D 28 41 pL pH n m
  Decimal  29 40 65 pL pH n m
  ```
- **Range:** (pL+(pH×256)) = 2 (pL=2, pH=0)  
  0 ≤ n ≤ 2, 48 ≤ n ≤ 50  
  1 ≤ m ≤ 3, 49 ≤ m ≤ 51
- **Description:** •  Executes a test print with a specified test pattern on a specified paper.  
  - pL and pH specifies the number of the parameter such as n, m to (pL + (pH × 256)) bytes.  
  n specifies the paper to be tested.  
  n           Paper  
  0, 48       Paper roll.
1, 49
2, 50

  ```
  m specifies a test pattern.
  m           Test Pattern
  1, 49       Hexadecimal dump.
  ```
2, 50       Printer status print.
3, 51       Rolling pattern print.
- **Details:** •  This command is enabled only when processed at the beginning of a line.  
  - When this command is received during macro definition, the printer ends macro definition and  
  begins executing this command.  
  - After test print is finished, the printer resets itself automatically. Therefore, the already-  
  defined data before this command is executed, such as user-defined characters, downloaded bit  
  image, and macro, becomes undefined, the receive buffer and print buffer are cleared, and each  
  setting returns to its default value.  
  - The printer cuts the paper at the end of the test print.  
  - The printer goes BUSY while this command is being executed.

#### `GS ( D pL pH m [a1 b1] ... [ak bk]`

- **Function:** Enable/disable real-time command.
- **Format:**

  ```
  ASCII  GS ( D pL pH m [a1 b1] ... [ak bk ]
  Hexadecimal  1D 28 44 pL pH m [a1 b1] ... [ak bk ]
  Decimal  29 40 68 pL pH m [a1 b1] ... [ak bk ]
  ```
- **Range:** (pL + pH×256) = 3, 5 (pL=3, 5;  pH=0)  
  m = 20  
  a = 1, 2  
  b = 0, 1, 48, 49
- **Default:**  
  a       Real-time command type                                 Default  
  1       DLE DC4 ƒn m t (ƒn = 1): Generate pulse in real-time   Enabled (b = 1)
2       DLE DC4 ƒn a b (ƒn = 2): Execute power-off sequence    Disabled (b = 0)
- **Description:** Enable or disable real-time commands, as described below:  
  a        b               Function  
  1        0, 48           Disable DLE DC4 ƒn m t (ƒn = 1) processing.
1, 49           Enable DLE DC4 ƒn m t (ƒn = 1) processing.
2        0, 48           Disable DLE DC4 ƒn a b (ƒn = 2) processing.
1, 49           Enable DLE DC4 ƒn a b (ƒn = 2) processing

  ```
  •  pL, pH specifies (pL + pH × 256) as the number of bytes after pH (m and [a1 b1]...[ak bk ]).
  •  a specifies the type of real-time command.
  •  b specifies when command is being enabled or disabled.
  ```
GS ( L pL pH m fn [parameters]

#### `GS 8 L p1 p2 p3 p4 m fn [parameters]`

- **Function:** Process graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n [parameters]
  Hexadecimal  1D 28 4C pL pH m f n [parameters]
  Decimal  29 40 76 pL pH m f n [parameters]
  ASCII  GS 8 L p1 p2 p3 p4 m fn [parameters]
  Hexadecimal  1D 38 4C p1 p2 p3 p4 m fn [parameters]
  Decimal  29 56 76 p1 p2 p3 p4 m fn [parameters]
  ```
- **Range:** fn = 0, 2, 3, 4, 48, 50, 51, 52, 64, 65, 66, 67, 69, 80, 81, 82, 83, 85 and 112.
- **Description:** Process graphics data according to function code  fn:

  ```
  ƒn      Format                                               Function
  0,      GS ( L pL pH m f n                                   Transmit NV graphics memory capacity.
  ```
2,      GS ( L pL pH m f n                                   Print graphics data in the print buffer.
3, 51   GS ( L pL pH m f n                                   Transmit the remaining capacity of NV graphics memory.
4, 52   GS ( L pL pH m f n                                   Transmit the remaining capacity of
downloaded graphics memory.
64      GS ( L pL pH m f n d1 d2                             Transmit the key code list for defined NV graphics.
65      GS ( L pL pH m f n d1 d2 d 3                         Delete all NV graphics data.
66      GS ( L pL pH m f n kc1 kc 2                          Delete specified NV graphics data.
67      GS ( L pL pH m fn a kc1 kc2 b xL xH                  Define a raster NV graphics data.
yL yH [c d1 ... dk]1 ... [c d1 ... dk ] b
69      GS ( L pL pH m f n kc1 kc 2 x y                      Print specified NV graphics data.
80      GS ( L pL pH m f n d1 d2                             Transmit key code list for defined download graphics
81      GS ( L pL pH m f n d1 d2 d 3                         Delete all downloaded graphics data.
82      GS ( L pL pH m f n kc1 kc 2                          Delete specified downloaded graphics data.
83      GS ( L pL pH m f n a kc1 kc 2 b xL xH yL             Define a raster downloaded graphics data.
yH [c d1 ... dk ]1 ... [c d1 ... dk ] b
85      GS ( L pL pH m f n kc1 kc 2 x y                      Print specified downloaded graphics data.
112     GS ( L pL pH m f n a bx by c xL xH yL yH d1 ... dk   Store raster graphics data in the print buffer memory.

  ```
  •  pL, pH specifies (pL + pH×256) as the number of bytes after pH (m, ƒn and [parameters]).
  •  p1, p2, p3, and p 4 specify (p1 + p2×256 + p3×65536 + p 4×16777216) as the number of bytes
  after p 4 (m, f n, and [parameters]).
  ```

  ```
  •  [parameters] is described in each function.
  •  ƒn defines the function code for the command.
  •  Function codes (ƒn) are identical for both GS ( L and GS 8 L commands. The only difference
  between them is the parameters (pL, pH, p1, p2, p3, and p 4), used to specify the number of bytes
  after m. Because of that, GS ( L can handle up to 65,535 bytes, while GS 8 L can handle up to
  4,294,967,296 bytes.
  ```
- **Notes:** •  The graphic functionality provided by both GS ( L and GS 8 L commands maintain upward  
  compatibility with conventional NV graphics commands (FS p and FS q), downloaded graphics  
  (GS * and GS /) and graphics (GS v 0).  
  - NV graphics (functions 48, 51, 64, 65, 66, 67 and 69) store data in NV memory.  
  - Downloaded graphics (functions 52, 80, 81, 82, 83 and 85) store data in volatile memory.  
  This data is lost when command ESC @ is executed, the printer is reset or power is turned off.  
  - Graphics (functions 50 and 112) store data in the print buffer. Printing starts using function  
  50, which also clear the print buffer. Function 50 should be executed just after function 112.  
  - NV graphics and downloaded graphics data are managed using key codes, expressed as kc1  
  and kc2. The key codes have a 2-byte configuration and can be specified using the full range of  
  character codes (32h to 7Eh).  
  - It is impossible to create definitions for both NV graphics data (this command) and NV bit  
  image data (FS q). NV bit image data definitions are deleted when this command is used.  
  - It is impossible to create definitions for both downloaded graphics data (this command) and  
  bit image data (GS *). Download bit image data definitions are deleted when this commands is  
  used.  
  - Functions 64 and 80 require ESC/POS handshaking protocol, as described below:

  ```
  Step    Host operation                        Printer operation
  1       This command sends                    Function 64/80 is initiated.
  function 64/80.
  2       Data is received                      Key code list is sent.
  from printer.
  3       Response code (*1) is sent.           Procedures (*2 and *3) are performed
  according to response code.
  ```

  ```
  (*1) Response Code
  ASCII      Hex         Dec         Request definition
  ACK        60          6           Send next data group.
  ```
NAK        15          21          Resend just-received data group.
CAN        18          24          Cancel send operation.

  ```
  (*2) Processing According to Response Code (When Send Data Remains (indicated by
  identification status of send data group))
  ASCII      Description
  ACK        Initiates operation to send next data.
  ```
NAK        Resends the just-received data.
CAN        Cancels processing initiated by this command.

  ```
  (*3) Processing According to Response Code (When No More Send Data Remains (indicated by
  identification status of send data group))
  ASCII      Description
  ACK, CAN   Cancels procedure initiated by this command.
  ```
NAK        Resends the just-received data.

#### `GS ( L pL pH m fn <fn = 48>`

- **Function:** Transmit NV graphics memory capacity.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n
  Hexadecimal  1D 28 4C pL pH m f n
  Decimal  29 40 76 pL pH m f n
  ```
- **Range:** (pL + pH×256) = 2  (pL=2;  pH=0)  
  m = 48  
  ƒn = 0, 48
- **Description:** Transmits the entire capacity of the NV graphics area, in bytes, as described in the table below:

  ```
  Transmit data      Hex          Dec         Data bytes
  Header              37          55          1
  ```
Identifier          30          48          1
Entire capacity     30 to 39    48 to 57    1 to 8
NUL                 00          0           1
The decimal value for the entire capacity is converted to text data and sent, starting from the
high order end.

#### `GS ( L pL pH m fn <fn = 50>`

- **Function:** Print graphics data in the print buffer.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n
  Hexadecimal  1D 28 4C pL pH m f n
  Decimal  29 40 76 pL pH m f n
  ```
- **Range:** (pL + pH×256) = 2  (pL=2;  pH=0)  
  m = 48  
  ƒn = 2, 50
- **Description:** Print buffered graphics data previously stored by GS ( L <function 112>.
- **Notes:** •  Printer cannot print when there is no graphics data stored in the print buffer.

#### `GS ( L pL pH m fn <fn = 51>`

- **Function:** Transmit the remaining capacity of NV graphics memory.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n
  Hexadecimal  1D 28 4C pL pH m f n
  Decimal  29 40 76 pL pH m f n
  ```
- **Range:** (pL + pH×256) = 2  (pL=2;  pH=0)  
  m = 48  
  ƒn = 3, 51
- **Description:** •  Transmit the number of bytes of remaining memory (unused area) in the NV graphics area, as  
  described below.

  ```
  Transmit data      Hex          Dec         Data bytes
  Header              37          55          1
  ```
Identifier          30          48          1
Entire capacity     30 to 39    48 to 57    1 to 8
NUL                 00          0           1

  ```
  •  The decimal value for the unused capacity is converted to text data and sent, starting from
  the high order end.
  •  This function cannot be used together with NV bit images (FS q).
  ```

#### `GS ( L pL pH m fn <fn = 52>`

- **Function:** Transmit the remaining capacity of downloaded graphics memory.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n
  Hexadecimal  1D 28 4C pL pH m f n
  Decimal  29 40 76 pL pH m f n
  ```
- **Range:** (pL + pH×256) = 2  (pL=2;  pH=0)  
  m = 48  
  ƒn = 4, 52
- **Description:** •  Transmit the number of bytes of remaining memory (unused area) in the downloaded graphics  
  area, as described below.

  ```
  Transmit data                Hex              Dec       Data bytes
  Header                              37               55             1
  ```
Identifier                          72               114            1
Identification status (*1) (*2)   40 or 41         64 or 65         1
Data (*3)                         30 to 39         48 to 57      2 to 80
NUL                                 00                0             1

  ```
  •  The decimal value for the unused capacity is converted to text data and sent, starting from
  the high order end.
  •  This function cannot be used together with downloaded bit images (GS *).
  ```

#### `GS ( L pL pH m fn d1 d2 <fn = 64>`

- **Function:** Transmit key code list for defined NV graphics.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n d1 d2
  Hexadecimal  1D 28 4C pL pH m f n d1 d2
  Decimal  29 40 76 pL pH m f n d1 d2
  ```
- **Range:** (pL + pH×256) = 4  (pL=4;  pH=0)  
  m = 48  
  ƒn = 64  
  d1 = 75  
  d2 = 67
- **Description:** •  Transmit defined NV graphics key code list, as described below. This function does require  
  ESC/POS Handshaking Protocol.

  ```
  Transmit data                Hex              Dec       Data bytes
  Header                              37               55             1
  ```
Identifier                          72               114            1
Identification status (*1) (*2)   40 or 41         64 or 65         1
Data (*3)                         30 to 39         48 to 57      2 to 80
NUL                                 00                0             1

  ```
  (*1) When the number of NV graphics data group exceeds 40, the groups are divided into blocks
  in compliance with the following conditions:
  o   When unsent data is present, the Identification status byte (byte 3) is set to
  hexadecimal value 41h (decimal value 65).
  o   When unsent data is not present, the Identification status byte (byte 3) is set to
  hexadecimal value 40h (decimal value 64).
  (*2) If the number of NV graphics data groups is 40 or less, they are sent in single batch, with
  the Identification status byte (byte 3) set to hexadecimal value 40h (decimal value 64).
  (*3) The data groups are arranged according to the key codes.
  ```
- When no key codes are present, printer response looks like:

  ```
  Transmit data              Hex                Dec               Data bytes
  Header                             37                55                1
  ```
Identifier                         72                114               1
Identification status              40                64                1
NUL                                00                 0                1
- This function cannot be used together with NV bit images (FS q).

#### `GS ( L pL pH m fn d1 d2 d 3 <fn = 65>`

- **Function:** Delete all NV graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n d1 d2 d 3
  Hexadecimal  1D 28 4C pL pH m f n d1 d2 d 3
  Decimal  29 40 76 pL pH m f n d1 d2 d 3
  ```
- **Range:** (pL + pH×256) = 5  (pL=5;  pH=0)  
  m = 48  
  ƒn = 65  
  d1 = 67  
  d2 = 76  
  d 3 = 82
- **Description:** •  Delete all NV graphics data defined with function 67.  
  - This function should be send at the beginning of a line.  
  - This function cannot be used inside macros.

#### `GS ( L pL pH m fn kc1 kc2 <fn = 66>`

- **Function:** Delete specified NV graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2
  Decimal  29 40 76 pL pH m f n kc1 kc2
  ```
- **Range:** (pL + pH×256) = 4  (pL=4;  pH=0)  
  m = 48  
  ƒn = 66  
  32 ≤ kc1 ≤ 126  
  32 ≤ kc2 ≤ 126
- **Description:** •  Deletes the NV graphics data defined by the key codes kc1 and kc2.  
  - This function should be send at the beginning of a line.  
  - This function cannot be used inside macros.
GS ( L pL pH m fn a kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk]b <fn = 67>
GS 8 L p1 p2 p 3 p 4 m fn a kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk] b
- **Function:** Define a raster NV graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Decimal  29 40 76 pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  ASCII  GS 8 L p1 p2 p1 p2 m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Hexadecimal  1D 38 4C p1 p2 p3 p4 m fn kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Decimal  29 56 76 p1 p2 p3 p4 m fn kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk ]b
  ```
- **Range:** 12 ≤ (pL + pH×256) ≤ 65,535  
  12 ≤ (p1 + p2×256 + p3×65536 + p 4×16777216) ≤ 4,718,604  
  m = 48  
  ƒn = 67  
  a = 48  
  32 ≤ kc1 ≤ 126  
  32 ≤ kc2 ≤ 126  
  b=1  
  1 ≤ (xL + xH×256) ≤ 8,192  (0 ≤ xL ≤ 255, 0 ≤ xH ≤ 32)  
  1 ≤ (yL + yH×256) ≤ 2,304  (0 ≤ yL ≤ 255, 0 ≤ yH ≤ 9)  
  c = 49  
  0 ≤ d ≤ 255  
  k = (int((xL + xH×256) + 7) / 8) × (yL + yH×256)
- **Description:** Define a raster NV graphics data as a record specified by the key code kc1 and kc2 in the NV  
  graphics area.  
  o b specifies the number of colors for the defined data.  
  o xL and xH specify the number of dots in the horizontal direction (xL + xH×256).  
  o yL and yH specify the number of dots in the vertical direction (yL + yH×256).  
  o c specifies the color of defined data.  
  o d specify raster data.  
  o k indicates the number of the definition data. k is an explanation parameter; therefore it  
  does not need to be transmitted.  
  - If the specified key code already exists in NV memory, data will be overwritten.
- **Notes:** •  This function is incompatible with macros, so make sure to avoid including it when defining macros.  
  - In cases where there is insufficient capacity available for storing NV graphics data, this  
  function cannot be used. Function 51 should be used to check the available capacity in the NV  
  graphics data area.  
  - This function should be send at the beginning of a line.  
  - The data for byte k of d1 ... dk is processed as a single item of defined NV graphics data. The  
  defined data (d) specifies “1” for bits corresponding to dots that will be printed and “0” for bits  
  corresponding to dots that will not be printed.  
  - Specify single data groups [c d1 ... dk ] when monochrome is selected (b = 1) as the color.  
  - NV graphics data is printed using function 69.  
  - Note that it is not possible to create definitions for both NV graphics data (this command) and  
  NV bit image data (FS q). NV bit image data definitions are deleted when this command is used.  
  - The relationship between raster NV graphics data and print results is shown in the table  
  below.
d1            d2              …               dx
dx+1           dx+2             …              dxx2
:              :              …                :
…             dk-2           dk-1             dk         x = xL + xH×256

#### `GS ( L pL pH m fn kc1 kc2 x y <fn = 69>`

- **Function:** Print specified NV graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2 x y
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2 x y
  Decimal  29 40 76 pL pH m f n kc1 kc2 x y
  ```
- **Range:** (pL + pH×256) = 6  (pL=6;  pH=0)  
  m = 48  
  ƒn = 69  
  32 ≤ kc1 ≤ 126  
  32 ≤ kc2 ≤ 126  
  x = 1, 2  
  y = 1, 2
- **Description:** •  Prints the NV graphics data defined by the key codes kc1 and kc2.  
  - x = 2 defines double height NV graphics print.  
  - y = 2 defines double width NV graphics print.
- **Notes:** •  This function is used to print NV graphics data defined using function 67.  
  - The specified key code must exist for the printer to print NV graphics data.  
  - Settings for text effect (bold, underline, orientation, etc. except for upside-down) and font  
  size do not affect the printing of the NV graphics data.

#### `GS ( L pL pH m fn d1 d2 <fn = 80>`

- **Function:** Transmit key code list for defined downloaded graphics.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n d1 d2
  Hexadecimal  1D 28 4C pL pH m f n d1 d2
  Decimal  29 40 76 pL pH m f n d1 d2
  ```
- **Range:** (pL + pH×256) = 4  (pL=4;  pH=0)  
  m = 48  
  f n = 80  
  d1 = 75  
  d2 = 67
- **Description:** •  Transmit defined downloaded graphics key code list, as described below. This function does  
  require ESC/POS Handshaking Protocol.

  ```
  Transmit data                     Hex          Dec               Data bytes
  Header                            37           55                1
  ```
Identifier                        73           115               1
Identification status (*1) (*2)   40 or 41     64 or 65          1
Data (*3)                         30 to 39     48 to 57          2 to 80
NUL                               00           0                 1
(*1) When the number of downloaded graphics data group exceeds 40, the groups are divided
into blocks in compliance with the following conditions:
When unsent data is present, the Identification status byte (byte 3) is set to hexadecimal value
41h (decimal value 65).
When unsent data is not present, the Identification status byte (byte 3) is set to hexadecimal
value 40h (decimal value 64).
(*2) If the number of NV graphics data groups is 40 or less, they are sent in single batch, with
the Identification status byte (byte 3) set to hexadecimal value 40h (decimal value 64).
(*3) The data groups are arranged according to the key codes.

  ```
  •  When no key codes are present, printer response looks like:
  Transmit data           Hex              Dec            Data bytes
  Header                     37               55                  1
  ```
Identifier                 73              114                  1
Identification status      40               64                  1
NUL                        00               0                   1
- This function cannot be used together with downloaded bit images (GS *).

#### `GS ( L pL pH m fn d1 d2 d 3 <fn = 81>`

- **Function:** Delete all downloaded graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n d1 d2 d 3
  Hexadecimal  1D 28 4C pL pH m f n d1 d2 d 3
  Decimal  29 40 76 pL pH m f n d1 d2 d 3
  ```
- **Range:** (pL + pH×256) = 5  (pL=5;  pH=0)  
  m = 48  
  ƒn = 81  
  d1 = 67  
  d2 = 76  
  d 3 = 82
- **Description:** •  Delete all downloaded graphics data defined with function 83.  
  - This function should be used at the beginning of a line.  
  - This function cannot be used inside macros.

#### `GS ( L pL pH m fn kc1 kc2 <fn = 82>`

- **Function:** Delete specified downloaded graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2
  Decimal  29 40 76 pL pH m f n kc1 kc2
  ```
- **Range:** (pL + pH×256) = 4  (pL=4;  pH=0)  
  m = 48  
  ƒn = 82  
  32 ≤ kc1 ≤ 126  
  32 ≤ kc2 ≤ 126
- **Description:** •  Deletes the downloaded graphics data defined by the key codes kc1 and kc2.  
  - This function should be used at the beginning of a line.  
  - This function cannot be used inside macros.
GS ( L pL pH m fn a kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk]b <fn = 83>
GS 8 L p1 p2 p3 p4 m fn a kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk]b
- **Function:**  
  Define a raster downloaded graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  Decimal  29 40 76 pL pH m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c d1 ... dk ]b
  ASCII  GS 8 L p1 p2 p1 p2 m f n kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1 ... dk ]b
  Hexadecimal  1D 38 4C p1 p2 p3 p4 m fn kc1 kc2 b xL xH yL yH [c d1 ... dk]1 ... [c d1
  ... dk ]b
  Decimal  29 56 76 p1 p2 p3 p 4 m f n kc1 kc2 b xL xH yL yH [c d1 ... dk ]1 ... [c
  d1 ... dk ]b
  ```
- **Range:** 12 ≤ (pL + pH×256) ≤ 65,535  
  12 ≤ (p1 + p2×256 + p3×65536 + p 4×16777216) ≤ 4,718,604  
  m = 48  
  ƒn = 83  
  a = 48  
  32 ≤ kc1 ≤ 126  
  32 ≤ kc2 ≤ 126  
  b = 1, 2  
  1 ≤ (xL + xH×256) ≤ 8,192  (0 ≤ xL ≤ 255, 0 ≤ xH ≤ 32)  
  1 ≤ (yL + yH×256) ≤ 2,304  (0 ≤ yL ≤ 255, 0 ≤ yH ≤ 9)  
  c = 49, 50  
  0 ≤ d ≤ 255
- **Description:** Define a raster downloaded graphics data as a record specified by the key code kc1 and kc2 in  
  the downloaded graphics area.  
  o b specifies the number of colors for the defined data.  
  o xL and xH specify the number of dots in the horizontal direction (xL + xH×256).  
  o yL and yH specify the number of dots in the vertical direction (yL + yH×256).  
  o c specifies the color of defined data.  
  o d specify raster data.  
  o k indicates the number of the definition data. k is an explanation parameter; therefore  
  it does not need to be transmitted.  
  - If the specified key code already exists in downloaded memory, data will be overwritten.
- **Notes:** •  Downloaded graphics indicate image data groups defined in the printer’s internal volatile  
  memory (RAM). Once the download graphics data have been defined, they are available until GS  
  ( L <function 83> or ESC @ is executed. The downloaded graphics data are lost when the  
  power is turned off or the printer is reset.  
  - This function is incompatible with macros, so make sure to avoid including it when defining  
  macros.  
  - In cases where there is insufficient capacity available for storing downloaded graphics data,  
  this function cannot be used. Function 52 should be used to check the available capacity in the  
  downloaded graphics data area.  
  - The data for byte k of d1 ... dk is processed as a single item of defined downloaded graphics  
  data. The defined data (d) specifies “1” for bits corresponding to dots that will be printed and  
  “0” for bits corresponding to dots that will not be printed.  
  - Specify single data groups [c d1 ... dk ] when monochrome is selected (b = 1) as the color.  
  - Downloaded graphics data is printed using function 85.  
  - Note that it is not possible to create definitions for both downloaded graphics data (this  
  command) and downloaded bit image data (GS *). Downloaded bit image data definitions are  
  deleted when this command is used.  
  - The relationship between raster downloaded graphics data and print results is shown in the  
  table below.  
  d1             d2            …             dx
dx+1          dx+2            …            dxx2
:             :             …              :
…             dk-2          dk-1           dk         x = xL + xH×256

#### `GS ( L pL pH m fn kc1 kc2 x y <fn = 85>`

- **Function:** Print specified downloaded graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n kc1 kc2 x y
  Hexadecimal  1D 28 4C pL pH m f n kc1 kc2 x y
  Decimal  29 40 76 pL pH m f n kc1 kc2 x y
  ```
- **Range:** (pL + pH×256) = 6  (pL=6;  pH=0)
m = 48
ƒn = 85
32 ≤ kc1 ≤ 126
32 ≤ kc2 ≤ 126
x = 1, 2
y = 1, 2
- **Description:** •  Prints the downloaded graphics data defined by the key codes kc1 and kc2.  
  - x = 2 defines double height downloaded graphics print.  
  - y = 2 defines double width downloaded graphics print.
- **Notes:** •  This function is used to print downloaded graphics data defined using function 83.  
  - The specified key code must exist for the printer to print downloaded graphics data.  
  - Settings for text effect (bold, underline, orientation, etc. except for upside-down) and font  
  size do not affect the printing of the downloaded graphics data.
GS ( L pL pH m fn a bx by c xL xH yL yH d1 ... dk <fn = 112>

#### `GS 8 L p1 p2 p 3 p 4 m fn a bx by c xL xH yL yH d1 ... dk`

- **Function:** Define a raster downloaded graphics data.
- **Format:**

  ```
  ASCII  GS ( L pL pH m f n a bx by c xL xH yL yH d1 ... dk
  Hexadecimal  1D 28 4C pL pH m f n a bx by c xL xH yL yH d1 ... dk
  Decimal  29 40 76 pL pH m f n a bx by c xL xH yL yH d1 ... dk
  ASCII  GS 8 L p1 p2 p1 p2 m f n a bx by c xL xH yL yH d1 ... dk
  Hexadecimal  1D 38 4C p1 p2 p3 p 4 m f n a bx by c xL xH yL yH d1 ... dk
  Decimal  29 56 76 p1 p2 p3 p4 m f n a bx by c xL xH yL yH d1 ... dk
  ```
- **Range:** 11 ≤ (pL + pH...256) ≤ 32,778  
  11 ≤ (p1 + p2×256 + p3×65536 + p 4×16777216) ≤ 32,778  
  m = 48; ƒn = 112; a = 48; 0 ≤ d ≤ 255  
  1 ≤ (xL + xH×256) ≤ 1,024  (0 ≤ xL ≤ 255, 0 ≤ xH ≤ 8)  
  1 ≤ (yL + yH×256) ≤ 1,476  (0 ≤ yL ≤ 255, 0 ≤ yH ≤ 2: by = 1)  
  1 ≤ (yL + yH×256) ≤ 738  (0 ≤ yL ≤ 255, 0 ≤ yH ≤ 2: by = 2)  
  c = 49, 50
- **Description:** Store raster graphics data in the print buffer.  
  o bx specify horizontal mode (normal or double width) and by specify vertical mode  
  (normal or double height).  
  o xL and xH specify the number of dots in the horizontal direction (xL + xH×256).  
  o  yL and yH specify the number of dots in the vertical direction (yL + yH×256).  
  o c specifies the color of defined data.  
  o d specify raster data.  
  o k indicates the number of the graphics data. k is an explanation parameter; therefore  
  it does not need to be transmitted.
- **Notes:** •  This function is incompatible with macros, so make sure to avoid including it when defining macros.  
  - Settings for text effect (bold, underline, orientation, etc. except for upside-down) and font  
  size do not affect the printing of the raster graphics data.  
  - The data for byte k of d1 ... dk is processed as a single item of defined graphics data. The  
  defined data (d) specifies “1” for bits corresponding to dots that will be printed and “0” for bits  
  corresponding to dots that will not be printed.  
  - Raster graphics data is printed using function 50.  
  - The relationship between raster graphics data and print results is shown in the table below.
d1         d2          …          dx
dx+1       dx+2        …          dxx2
:          :           …          :
…          dk-2        dk-1       dk          x = xL + xHx256

#### `GS ( N pL pH fn [parameter]`

- **Function:** Select character effects.
- **Format:**

  ```
  ASCII  GS ( N pL pH f n
  Hexadecimal  1D 28 4E pL pH f n
  Decimal  29 40 78 pL pH f n
  ```
- **Range:** ƒn = 48
- **Description:** Selects character effects, according to fn value, as described in the table below.  
  ƒn       Function  
  48       Select character color.
- pL, pH specifies (pL + pH × 256) as the number of bytes after pH (ƒn and [parameter]).
- **Notes:** • Setting of this command affect printing of alphanumeric, multilingual, user-defined characters  
  and user defined ideograms.  
  - Setting of this command is effective until ESC @ is executed, the printer is reset of the power  
  is turned off.  
  - Setting of this command does not affect printing of graphics, bit image, bar code (including  
  HRI characters) and two dimension code.  
  - The color of the graphics can be specified by GS ( L.  
  - Dual color printing depends on dual color thermal paper usage. Color #1 is black and uses  
  high energy in the print head. Color #2 is red and uses low energy in the print head.  
  - This command is effective only in models with dual color feature enabled.

#### `GS ( N pL pH fn m <fn = 48>`

- **Function:** Select character color.
- **Format:**

  ```
  ASCII  GS ( N pL pH f n m
  Hexadecimal  1D 28 4E pL pH f n m
  Decimal  29 40 78 pL pH f n m
  ```
- **Range:** (pL + pH×256) = 2  (pL=2;  pH=0)  
  ƒn = 48  
  m = 48, 49, 50
- **Default:** m = 49
- **Description:** Selects character color specified by m as follows.

  ```
  m        Character color
  48       Not (do not print).
  ```
49       Color #1 (Black)
50       Color #2 (Red)
- **Notes:** •  When underline is turned on, the underline will be printed in the color specified by this  function.  
  - In white/black reverse print mode, the printer treats the character as non-printing dots and  
  prints the background in the color specified by this function.  
  - This command is effective only in models with dual color feature enabled.

#### `GS ( k pL pH cn fn [parameters]`

- **Function:** Specify and print symbol.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n [parameters]
  Hexadecimal  1D 28 6B pL pH cn f n [parameters]
  Decimal  29 40 107 pL pH cn f n [parameters]
  ```
- **Range:** cn = 48 (PDF417 code).  
  ƒn = 65, 66, 67, 68, 69, 70, 80, 81, 82.
- **Description:** Process data for two-dimensional codes.  
  - Symbol type is specified by cn.  
  - Function code ƒn specifies the function.

  ```
  cn         ƒn     Function
  48         65     PDF417: Set number of columns in the data region.
  ```
66     PDF417: Set number of rows.
67     PDF417: Set the width of the module.
68     PDF417: Set the row height.
69     PDF417: Set the error correction level.
70     PDF417: Select options.
80     PDF417: Store data in the symbol storage area.
81     PDF417: Print symbol data in the symbol storage area.
82     PDF417: Transmit the size information of the symbol data in the
symbol storage area

  ```
  •  pL, pH specifies (pL + pH × 256) as the number of bytes after pH (cn and fn and [parameters].
  •  [parameters] are described in each function.
  ```
- **Notes:** •  The symbol data specified by function 80 d1...dk is stored in memory and it can be printed  
  using function 81. The symbol data in the symbol storage area is reserved until the following  
  processing is performed:  
  o Function 80 is executed.  
  o  ESC @ is executed.  
  o The printer is reset or the power is turned off.  
  - When processing function 81 or 82, the setting values of functions 65 to 70 are used. If the  
  printable area is not large enough, the symbol may not be printed.  
  - Executing function 81 after executing function 80 repeatedly prints the same symbol data.  
  - By using functions 65 to 70 combined with function 81, the same symbol data d1...dk is printed  
  differently.  
  - By using function 82, the symbol size printed by function 81 is available.

#### `GS ( k pL pH cn fn n <fn = 65>`

- **Function:** PDF417: Set number of columns in the data region.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n n
  Hexadecimal  1D 28 6B pL pH cn f n n
  Decimal  29 40 107 pL pH cn f n n
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 65  
  0 ≤ n ≤ 30
- **Default:** n=0
- **Description:** Sets the number of columns in the data region for PDF417.  
  - When n = 0, automatic processing is selected.  
  - When n ≠ 0, the number of columns in the data region is set to n codeword.
- **Notes:** •  Setting of this function affect the processing of functions 81 and 82.  
  - When auto processing (n = 0) is selected, the maximum number of columns in the data area  
  is 30 columns.

  ```
  •  The following data is not included in the number of columns:
  o Start pattern and stop pattern.
  o Indicator codeword of left and right.
  •  When automatic processing (n = 0) is selected, the number of columns is calculated by the
  print area when processing functions 81, 82, module width (function 67), and option setting
  (function 70).
  •  Settings of this function are effective until ESC @ is executed, the printer is reset, or the
  power is turned off.
  ```

#### `GS ( k pL pH cn fn n <fn = 66>`

- **Function:** PDF417: Set number of rows.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n n
  Hexadecimal  1D 28 6B pL pH cn f n n
  Decimal  29 40 107 pL pH cn f n n
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 66  
  n = 0 (automatic processing)
- **Description:** Set number of rows for PDF417. Only automatic processing (n = 0) is available.

#### `GS ( k pL pH cn fn n <fn = 67>`

- **Function:** PDF417: Set the width of the module.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n n
  Hexadecimal  1D 28 6B pL pH cn f n n
  Decimal  29 40 107 pL pH cn f n n
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 67  
  2≤n≤8
- **Default:** n=3
- **Description:** Set to n dots the width of the module for PDF417.
- **Notes:** •  Settings of this function affect the processing of functions 81 and 82.  
  - Settings of this function are effective until ESC @ is executed, the printer is reset, or the  
  power is turned off.

#### `GS ( k pL pH cn fn n <fn = 68>`

- **Function:** PDF417: Set the row height.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n n
  Hexadecimal  1D 28 6B pL pH cn f n n
  Decimal  29 40 107 pL pH cn f n n
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 68  
  2≤n≤8
- **Default:** n=3
- **Description:** Set row height to [n × (module width)] for PDF417.
- **Notes:** •  Settings of this function affect the processing of functions 81 and 82.  
  - Settings of this function are effective until ESC @ is executed, the printer is reset, or  
  the power is turned off.

#### `GS ( k pL pH cn fn m n <fn = 69>`

- **Function:** PDF417: Set the error correction level.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n m n
  Hexadecimal  1D 28 6B pL pH cn f n m n
  Decimal  29 40 107 pL pH cn f n m n
  ```
- **Range:** (pL + pH×256) = 4  (pL=4;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 69  
  m = 48, 49  
  48 ≤ n ≤ 56 [m = 48]  
  1 ≤ n ≤ 40 [m = 49]
- **Default:** m = 49, n = 1
- **Description:** Set error correction level for PDF417.  
  m             Function  
  48            The error correction level is set by “level”.
49            The error correction level is set by “ratio”. The ratio is [n x 10%]
- **Notes:** •  Settings of this function affect the processing of functions 81 and 82.  
  - Error correction level is specified by either “level” or “ratio.”  
  - Error correction level specified by “level” (m = 48) is as follows. The number of the error  
  correction codeword is fixed regardless of the number of codeword in the data area.  
  n        Function                     Number of error correction codeword  
  48       Error correction level 0                                 2
49       Error correction level 1                                 4
50       Error correction level 2                                 8
51       Error correction level 3                                 16
52       Error correction level 4                                 32
53       Error correction level 5                                 64
54       Error correction level 6                                128
55       Error correction level 7                                256
56       Error correction level 8                                512

  ```
  •  Error correction level specified by “ratio” (m = 49) is as follows. The error correction level
  is defined by [number of data codeword × n × 0.1 = (A)]. The number of the error correction
  codeword changes depending on the number of codeword in the data area.
  (A)              Function                   Number of error correction codeword
  0–3              Error correction level 1   4
  ```
4 – 10           Error correction level 2   8
11 – 20          Error correction level 3   16
21 – 45          Error correction level 4   32
46 – 100         Error correction level 5   64
101 – 200        Error correction level 6   128
201 – 400        Error correction level 7                             256
401 or more      Error correction level 8                             512

  ```
  •  The error correction codeword calculated by modulus 929.
  •  Settings of this function are effective until ESC @ is executed, the printer is reset, or the
  power is turned off.
  ```

#### `GS ( k pL pH cn fn n <fn = 70>`

- **Function:** PDF417: Select option.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n n
  Hexadecimal  1D 28 6B pL pH cn f n n
  Decimal  29 40 107 pL pH cn f n n
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 70  
  n = 0 (standard PDF417)
- **Description:** Select option for PDF417. Only standard PDF417 is supported.

#### `GS ( k pL pH cn fn m d1 ... dk <fn = 80>`

- **Function:** PDF417: Store data in the symbol storage area.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n m d1 ... dk
  Hexadecimal  1D 28 6B pL pH cn f n m d1 ... dk
  Decimal  29 40 107 pL pH cn f n m d1 ... dk
  ```
- **Range:** 4 ≤ (pL + pH×256) ≤ 65,535  (pL ≤ 255;  pH ≤ 255)  
  cn = 48 (PDF417 code)  
  ƒn = 80  
  m = 48  
  0 ≤ d ≤ 255  
  k = (pL + pH×256) – 3
- **Description:** Store PDF417 symbol data (d1 ... dk ) in the symbol storage area.
- **Notes:** •  Data stored in the symbol storage area is processed by functions 81 and 82. This data is not  
  destroyed after execution of function 81 or 82.  
  - k bytes of d1...dk are processed as symbol data.  
  - Specify only the data codeword of the symbol with this function. The information listed below  
  is added automatically by the printer:  
  o Start pattern and stop pattern.  
  o Indicator codeword of left and right.  
  o The descriptor of symbol length (the first codeword in the data area).  
  o  The error correction codeword calculated by modulus 929.  
  - Settings of this function are effective until the following processing is performed:  
  o Function 80 is executed.  
  o  ESC @ is executed.  
  o The printer is reset or the power is turned off.

#### `GS ( k pL pH cn fn m <fn = 81>`

- **Function:** PDF417: Print symbol data in the symbol storage area.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n m
  Hexadecimal  1D 28 6B pL pH cn fn m
  Decimal  29 40 107 pL pH cn fn m
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 81  
  m = 48
- **Description:** Encodes and prints the PDF417 symbol data stored in the symbol storage area by function 80.
- **Notes:** •  A symbol that size exceeds the print area cannot be printed.  
  - If there is any an inconsistence in the data of symbol storage area, it cannot be printed.  
  o There is no data (function 80 was not executed).  
  o If [(number of columns × number of rows) < number of codeword] when auto  
  processing is specified for number of columns and number of rows.  
  o  Number of codeword exceeds 928 in the data area.

  ```
  •  The following data are added automatically by the encode process:
  o Start pattern and stop pattern.
  o Indicator codeword of left and right.
  o The descriptor of symbol length (the first codeword in the data area).
  o  The error correction codeword calculated by modulus 929.
  o Pad codeword.
  •  When auto processing (function 65) is specified, the number of columns is calculated by the
  current print area, module width (function 67), option setting (function 70), and the codeword
  in the data area. Maximum number of columns is 30.
  •  Printing of symbol is not affected by print mode (emphasized, double-strike, underline, white/
  black reverse printing, or 90° clockwise-rotated), except for character size and upside-down
  print mode.
  •   This command executes paper feeding for the amount needed for printing the symbol
  regardless of the paper feed amount set by the paper feed setting command. The print position
  returns to the left side of the printable area after printing the symbol.
  •  The quiet zone is not included in the printing data. Be sure to include the quiet zone when
  using this function.
  ```

#### `GS ( k pL pH cn fn m <fn = 82>`

- **Function:** PDF417: Transmit the size information of the symbol data in the symbol storage area.
- **Format:**

  ```
  ASCII  GS ( k pL pH cn f n m
  Hexadecimal  1D 28 6B pL pH cn f n m
  Decimal  29 40 107 pL pH cn f n m
  ```
- **Range:** (pL + pH×256) = 3  (pL=3;  pH=0)  
  cn = 48 (PDF417 code)  
  ƒn = 82  
  m = 48
- **Description:** Transmit the size information for the encoded PDF417 symbol data stored in symbol storage  
  area by function 80.
- **Notes:** •  The size information for each data is as follows:  
  Transmit data               Hex                  Dec          Data bytes  
  Header                      37                   55           1
Identifier                  2F                   47           1
Horizontal size (*1)        30 – 39              48 – 57      1–5
Separator                   1F                   31           1
Vertical size (*1)          30 – 39              48 – 57      1–5
Separator                   1F                   31           1
Fixed value                 31                   49           1
Separator                   1F                   31           1
Other information (*2)      30 or 31             48 to 49     1
NUL                         00                   0            1
(*1) “Horizontal size” and “vertical size” indicate the number of dots of the symbol.
(*2) “Other information” indicates whether printing of the data in the symbol storage area is
possible or impossible. The “other information” is the following.

  ```
  Hex           Dec        Condition
  30            48         Printing is possible.
  ```
31            49         Printing is impossible.

  ```
  •  The decimal value of the vertical size and horizontal size is converted to text data and sent
  starting from the high order end.
  •  Size information indicates the size of symbol printed by function 81.
  •  The quiet zone is not included in the size information.
  ```

#### `GS :`

- **Function:** Start/end macro definition.
- **Format:**

  ```
  ASCII  GS :
  Hexadecimal  1D 3A
  Decimal  29 58
  ```
- **Description:** Start/end macro definition.
- **Details:** •   Macro definition starts when this command is received during normal operation. Macro  
  definition ends when this command is received during macro definition.  
  - When GS ^ is received during macro definition, the printer ends macro definition and clears  
  the definition.  
  - Macro content is not cleared by ESC @. Therefore, ESC @ can be included in the contents  
  of a macro.  
  - Macro contents may have up to 2048 bytes. If a macro is defined with more than 2048 bytes,  
  excess data is not stored.
- **Reference:** GS ^

#### `GS B n`

- **Function:** Turn white/black reverse printing mode on/off.
- **Format:**

  ```
  ASCII  GS B n
  Hexadecimal  1D 42 n
  Decimal  29 66 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Turn on/off white/black reverse printing mode.  
  - When the LSB of n is 0, white/black reverse mode is turned off.  
  - When the LSB of n is 1, white/black reverse mode is turned on.
- **Details:** •  Only the least significant bit of n is valid.  
  - This command is valid for built-in characters and user-defined characters.  
  - When white/black reverse printing mode is on, it also applies to character spacing set by  
  ESC SP.  
  - This command does not affect bit image, user-defined bit image, bar code, HRI characters  
  and spacing skipped by HT, ESC $, and ESC \.  
  - This command does not affect the spaces between lines.  
  - White/black reverse mode has a higher priority than underline mode. Even if underline mode  
  is on, it is disabled (but not canceled) when white/black reverse mode is selected.

#### `GS H n`

- **Function:** Select print position for HRI characters.
- **Format:**

  ```
  ASCII  GS H n
  Hexadecimal  1D 48 n
  Decimal  29 72 n
  ```
- **Range:** 0 ≤ n ≤ 3, 48 ≤ n ≤ 51
- **Default:** n=0
- **Description:** Select print position for HRI in barcodes. n selects the print position as follows:  
  n         Print position  
  0, 48     Not printed.
1, 49     Above barcode.
2, 50     Below barcode.
3, 51     Both above and below barcode.
- **Details:** •  HRI stands for Human Readable Interpretation.  
  - HRI characters are printed using the font specified by GS f.
- **References:** GS f, GS k

#### `GS I n`

- **Function:** Transmit printer ID.
- **Format:**

  ```
  ASCII  GS I n
  Hexadecimal  1D 49 n
  Decimal  29 73 n
  ```
- **Range:** 1 ≤ n ≤ 3, 49 ≤ n ≤ 51, 65 ≤ n ≤ 69
- **Description:** Transmits the printer ID specified by n as follows:  
  n          Printer ID               Specification          ID (Hex)  
  1, 49      Printer ID Model         MP-4200 TH                     55
2, 50      Type ID                  See table below.
3, 51      ROM version ID           Depends on ROM version.
65         Firmware version         Depends on firmware version.
66         Manufacturer             Bematech
67         Printer name             MP-4200 TH
68         Serial number            Depends on serial number.
69         Type of model            Japanese model: KANJI JAPANESE
Simplified Chinese: CHINA EUC-CN
Traditional Chinese: TAIWAN BIG-5E
n = 2: Type ID

  ```
  Bit   Off/On    Hex    Decimal    Function
  0       Off     00        0      Two-byte character code not supported.
  ```
On      01        1      Two-byte character code supported.
1       On      02        2      Auto-cutter equipped.
2       Off     00        0      Not used. Fixed to off.
3       Off     00        0      Not used. Fixed to off.
4       Off     00        0      Not used. Fixed to off.
5        -       -        -      Undefined.
6        -       -        -      Undefined.
7       Off     00        0      Not used. Fixed to off.
- **Details:** •  When DTR/DSR control is selected in the serial interface model, the printer transmits printer  
  ID after confirming that the host is ready to receive data.  
  - When XON/XOFF control is selected in the serial interface model, the printer transmits the  
  printer ID without confirming the condition of the DSR signal.  
  - The printer ID is transmitted when command bytes are processed in the receive buffer.  
  Therefore, there may be a time gap between receiving this command and transmitting the  
  status, depending on the receive buffer status.  
  - When printer ID transmission is specified with (1 ≤ n ≤ 3) or (49 ≤ n ≤ 51), one byte code  
  is transmitted.  
  - When Auto Status Back (ASB) is enabled using GS a, the printer ID transmitted by GS I and  
  the ASB status must be differentiated.  
  - When printer ID is specified with (65 ≤ n ≤ 69), the [Header + Data + NUL] contents is  
  transmitted, where:  
  o  Header: Hexadecimal = 5Fh / Decimal = 95 (1 byte)  
  o  Data: Printer information  
  o  NUL: Hexadecimal = 00h / Decimal = 0 (1 byte)

#### `GS L nL nH`

- **Function:** Set left margin.
- **Format:**

  ```
  ASCII  GS L nL nH
  Hexadecimal  1D 4C nL nH
  Decimal  29 79 nL nH
  ```
- **Range:** 0 ≤ nL ≤ 255  
  0 ≤ nH ≤ 255
- **Default:** nL = 0, nH = 0
- **Description:** Set left margin using nL and nH.  
  - The left margin is set to [(nL + nH × 256) × horizontal motion unit)] inches.
- **Details:** •  This command is effective only when processed at the beginning of a line.  
  - If settings exceed printable area, the maximum value of the printable area is used.  
  - The horizontal and vertical motion units are specified by GS P. Changing the horizontal and  
  vertical motion unit does not affect the current left margin.
- The horizontal motion unit (x) is used for calculating left margin. The calculated result is
truncated to the minimum value of the mechanical pitch.
- **References:** GS P, GS W

#### `GS P x y`

- **Function:** Set horizontal and vertical motion units.
- **Format:**

  ```
  ASCII  GS P x y
  Hexadecimal  1D 50 x y
  Decimal  29 80 x y
  ```
- **Range:** 0 ≤ x ≤ 255  
  0 ≤ y ≤ 255
- **Description:** Sets the horizontal and vertical motion units to approximately 25.4/x mm {1/x inches} and  
  approximately 25.4/y mm {1/y inches}, respectively.
- **Details:** •  The horizontal direction is perpendicular to the paper feed direction and the vertical direction  
  is the paper feed direction.  
  - The following commands use x or y, regardless of character rotation (upside-down or 90°  
  clockwise rotation):  
  o  Commands using x: ESC SP, ESC $, ESC \, FS S, GS L, GS W  
  o  Commands using y: ESC 3, ESC J, GS V  
  - The command does not affect previously specified values.  
  - The calculated result from combining this command with others is truncated to the minimum  
  value of the mechanical pitch.
- **References:** ESC SP, ESC $, ESC 3, ESC J, ESC \, GS L, GS V, GS W

#### `GS V m`

- **Function:** Select paper cut mode.
- **Format:**

  ```
  ASCII  GS V m
  Hexadecimal  1D 56 m
  Decimal  29 86 m
  ```
- **Range:** m = 0, 1, 48, 49
- **Description:** If m = 0 or m = 48 perform a full paper cut.  
  If m = 1 or m = 49 perform a partial paper cut.
- **Details:** •  This command is effective only if processed at the beginning of a line.

#### `GS V m n`

- **Function:** Feed and cut paper.
- **Format:**

  ```
  ASCII  GS V m n
  Hexadecimal  1D 56 m n
  Decimal  29 86 m n
  ```
- **Range:** m = 66  
  0 ≤ n ≤ 255
- **Description:** Feed and cut paper. For this command, m should be 66 and n is the amount of paper to feed. First  
  of all, paper is advanced and then cut.
- **Details:** •  This command is effective only if processed at the beginning of a line.  
  - When n = 0, the printer feeds the paper to the cutting position and cuts it.  
  - When n ≠ 0, the printer feeds the paper to (cutting position + [n × vertical motion unit])  
  and cuts it.  
  - The horizontal and vertical motion units are specified by GS P.  
  - The paper feed amount is calculated using the vertical motion unit (y). However, the value  
  cannot be less than the minimum vertical movement amount, and it must be in even units of the  
  minimum vertical movement amount.

#### `GS W nL nH`

- **Function:** Set printing area width.
- **Format:**

  ```
  ASCII  GS W nL nH
  Hexadecimal  1D 57 nL nH
  Decimal  29 87 nL nH
  ```
- **Range:** 0 ≤ nL ≤ 255  
  0 ≤ nH ≤ 255
- **Default:** nL = 0; nH = 2
- **Description:** Set printing area width to [(nL + nH × 256) × horizontal motion unit].
- **Details:** •  This command is effective only when processed at the beginning of a line.  
  - If settings exceed printable area, the maximum value of the printable area is used.  
  - The horizontal and vertical motion units are specified by GS P. Changing the horizontal and  
  vertical motion unit does not affect the current left margin.  
  - The horizontal motion unit (x) is used for calculating left margin. The calculated result is  
  truncated to the minimum value of the mechanical pitch.  
  - If requested printing area width less than one character the following processing is performed:  
  1. The printing area width is extended to the right to accommodate one character.
2. If printing area width cannot be extended, the left margin is reduced to accommodate one
character.

  ```
  3.  If printing area width cannot be extended, the right margin is reduced to accommodate one character.
  •  If the width set for the printing area is less than one vertical line, the following processing is performed only on
  the line in question when data other than character data (e.g., bit image, user-defined bit image) is being processed:
  1. The printing area width is extended to the right to accommodate one line in vertical for the
  bit image within the printable area.
  2. If the printing area width cannot be extended sufficiently, the left margin is reduced to
  accommodate one line in vertical.
  •   The commands which set the printing area width for bit image printing and its minimum
  widths are as follows:
  •  Bit image (ESC *):
  Single density mode = 2 dots
  Double density mode = 1 dot
  •  Downloaded bit image (GS /):
  Double width mode or Quadruple mode = 2 dots
  Normal mode or Double-height mode = 1 dot
  ```
- NV bit image (FS p):
Double width mode or Quadruple mode = 2 dots
Normal mode or Double-height mode = 1 dot
- Raster bit image (GS v 0):
Double width mode or Quadruple mode = 2 dots
Normal mode or Double-height mode = 1 dot
- **References:** GS L, GS P

#### `GS ^ r t m`

- **Function:** Execute macro.
- **Format:**

  ```
  ASCII  GS ^ r t m
  Hexadecimal  1D 5E r t m
  Decimal  29 94 r t m
  ```
- **Range:** 0 ≤ r ≤ 255  
  0 ≤ t ≤ 255  
  m = 0, 1
- **Description:** Execute a macro.  
  - r specifies the number of macro executions.  
  - t specifies the waiting time between consecutive macro executions.  
  - m specifies macro executing mode.  
  o  When the LSB of m = 0, the macro executes r times continuously at the interval  
  specified by t.  
  o  When the LSB of m = 1, after waiting for the period specified by t, the INFO led  
  blinks and the printer waits for the FEED button to be pressed. After the button is  
  pressed, the printer executes the macro once again. The printer repeats this operation  
  r times.
- **Details:** •  The waiting time is t × 100 ms for every macro execution.  
  - If this command is received while a macro is being defined, the macro definition is aborted  
  and the definition is cleared.  
  - If the macro is not defined or if r is 0, nothing is executed.  
  - When a macro is executed (m = 1), paper cannot be fed using the FEED button.
- **Reference:** GS :

#### `GS a n`

- **Function:** Enable/disable Automatic Status Back (ASB).
- **Format:**

  ```
  ASCII  GS a n
  Hexadecimal  1D 61 n
  Decimal  29 97 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Description:** Enable or disable ASB and specify which status items should be included according to n, as follows:  
  Bit     Off/On     Hex      Decimal                       Function  
  0       Off       00         0       Drawer kick-out connector pin 3 status disabled.
On       01         1       Drawer kick-out connector pin 3 status enabled.
1       Off       00         0       Online/offline status disabled.
On       02         2       Online/offline status enabled.
2       Off       00         0       Error status disabled.
On       04         4       Error status enabled.
3       Off       00         0       Paper roll sensor status disabled.
On       08         8       Paper roll sensor status enabled.
4-7        -         -          -      Undefined.
- **Details:** •  If any status item is enabled, the printer transmits the status when this command is executed.  
  The printer automatically transmits the status whenever an enabled status item changes.  
  - If all status items are disabled, the ASB function is also disabled.  
  - If ASB is enabled by default, as soon as printer is turned on and is able to transmit and receive  
  data transmits, the status is send.  
  - The four status bytes are transmitted without confirming whether the host is ready to receive  
  data or not. The four status bytes must be consecutive, except for the XOFF code.  
  - Since this command is executed after data is processed in the receive buffer, there may be a  
  time gap between command reception and status transmission.  
  - When printer is disabled by ESC = (Select peripheral device), the four status bytes are  
  transmitted whenever the status changes.  
  - The status to be transmitted are as follows:  
  Firs byte (Printer information)  
  Bit     On/Off       Hex          Dec           Function  
  0       Off          00           0             Not used. Fixed to off.
1       Off          00           0             Not used. Fixed to off.
2       Off          00           0             Drawer kick-out connector pin is LOW.
On           04           4             Drawer kick-out connector pin is HIGH.
3       Off          00           0             Printer online.
On           08           8             Printer offline.
4       On           10           16            Not used. Fixed to on.
5       On           00           0             Cover is closed.
Off          20           32            Cover is opened.
6       On           00           0             Paper is not being fed by FEED button.
Off          40           64            Paper is being fed by FEED button.
7       Off          00           0             Not used. Fixed to off.

  ```
  o Second byte (Printer information)
  Bit    Off/On      Hex     Dec                             Function
  0         -      -        -         Undefined.
  ```
1         -      -        -         Undefined.
2         -      -        -         Undefined.
3      Off       00       0         No auto-cutter error.
On      08       8         An auto-cutter error has occurred.
4      Off       00       0         Not used. Fixed to Off.
5      Off       00       0         No unrecoverable error.
On      20      32         An unrecoverable error has occurred.
6      Off       00       0         No automatically recoverable error.
On      40      64         An automatically recoverable error has occurred.
7      Off       00       0         Not used. Fixed to Off.

  ```
  •  Bit 3: If these errors occur due to paper jam, it is possible to recover by correcting the cause
  of the error and executing DLE ENQ n (1 ≤ n ≤ 2). If an error due to a circuit failure (e.g. wire
  break) occurs, it is impossible to recover.
  •   Bit 6: When printing is stopped due to high print head temperature, the printer remains
  stopped until the print head temperature drops sufficiently. This error can also occur when paper
  roll cover is opened.
  ```

  ```
  o Third byte (Paper sensor information)
  Bit        Off/On            Hex       Dec                      Function
  0, 1          Off            00          0      Paper roll near-end sensor: paper OK.
  ```
On             03          3      Paper roll near-end sensor: paper near end.
2, 3          Off            00          0      Paper roll end sensor: paper present.
On             0C         12      Paper roll end sensor: paper not present.
4            Off            10         16      Not used. Fixed to Off.
5, 6           -              -          -      Undefined.
7            Off            00          0      Not used. Fixed to Off.

  ```
  o Fourth byte (Paper sensor information)
  Bit        Off/On            Hex       Dec                      Function
  0, 3           -              -          -      Undefined.
  ```
4            Off            00          0      Not used. Fixed to off.
5, 6           -              -          -      Undefined.
7            Off            00          0      Not used. Fixed to off.
- **References:** DLE EOT, GS r

#### `GS f n`

- **Function:** Select font for Human Readable Interpretation (HRI) characters.
- **Format:**

  ```
  ASCII  GS f n
  Hexadecimal  1D 66 n
  Decimal  29 102 n
  ```
- **Range:** n = 0, 1, 48, 49
- **Default:** n=0
- **Description:** Select a font for the HRI characters used during a barcode printing. n selects a font from the  
  following table:

  ```
  n          Print position
  0, 48      Font C (14 x 24).
  ```
1, 49      Font D (10.5 x 24).
- **Details:** •  HRI stands for Human Readable Interpretation.  
  - HRI characters are printed at the position specified by GS H.
- **References:** GS H, GS k

#### `GS h n`

- **Function:** Select barcode height.
- **Format:**

  ```
  ASCII  GS h n
  Hexadecimal  1D 68 n
  Decimal  29 104 n
  ```
- **Range:** 1 ≤ n ≤ 255
- **Default:** n = 192
- **Description:** Select barcode height. n specifies the number of dots in the vertical direction.
- **Reference:** GS k
(1) GS k m d1 ... dk NUL

#### `(2) GS k m n d1 ... dn`

- **Function:** Print barcode.
- **Format:**

  ```
  ASCII  (1) GS k m d1 ... dk NUL
  (2) GS k m n d1 ... dn
  Hexadecimal  (1) 1D 6B m d1 ... dk 00
  (2) 1D 6B m n d1 ... dn
  Decimal  (1) 29 107 m d1 ... dk 0
  (2) 29 107 m n d1 ... dn
  ```
- **Range:** (1) 0 ≤ m ≤ 6 (k and d depends on the barcode system used)  
  (2) 65 ≤ m ≤ 73 (n and d depends on the barcode system used)
- **Description:** Selects a bar code system and prints the bar code.

  ```
  Barcode
  m                   Number of Characters                      Remarks
  System
  (1)       0    UPC-A      11 ≤ k ≤ 12                 48 ≤ d ≤ 57
  ```
1    UPC-E      11 ≤ k ≤ 12                 48 ≤ d ≤ 57
2    EAN13      12 ≤ k ≤ 13                 48 ≤ d ≤ 57
3    EAN8       7≤k≤8                       48 ≤ d ≤ 57
4    CODE39     1≤k                         48 ≤ d ≤ 57, 65 ≤ d ≤ 90, 32, 36,
37, 43, 45, 46, 47
5    ITF        1 ≤ k (even number)         48 ≤ d ≤ 57
6    CODABAR    1≤k                         48 ≤ d ≤ 57, 65 ≤ d ≤ 68,  36, 43,
45, 46, 47, 58
(2)       65   UPC-A      11 ≤ n ≤ 12                 48 ≤ d ≤ 57
66   UPC-E      11 ≤ n ≤ 12                 48 ≤ d ≤ 57
67   EAN13      12 ≤ n ≤ 13                 48 ≤ d ≤ 57
68   EAN8       7≤n≤8                       48 ≤ d ≤ 57
69   CODE39     1 ≤ n ≤ 255                 48 ≤ d ≤ 57, 65 ≤ d ≤ 90, 32, 36,
37, 43, 45, 46, 47
70   ITF        1 ≤ n ≤ 255 (even number)   48 ≤ d ≤ 57
71   CODABAR    1 ≤ n ≤ 255                 48 ≤ d ≤ 57, 65 ≤ d ≤ 68,  36, 43,
45, 46, 47, 58
72   CODE93     1 ≤ n ≤ 255                 0 ≤ d ≤ 127
73   CODE128    2 ≤ n ≤ 255                 0 ≤ d ≤ 127

  ```
  [Details for (1)] •  This command ends with a NUL code.
  •  When the barcode system used is UPC-A or UPC-E, the printer prints barcode data after
  receiving the 12 bytes.
  •   When the barcode system used is EAN13, the printer prints barcode after receiving 13
  bytes.
  •  When the bar code system used is EAN8, the printer prints barcode after receiving 8 bytes.
  •  The amount of data for ITF barcode must be even. When an odd number of bytes are input,
  the printer ignores the last byte.
  [Details for (2)] •   n indicates the number of barcode bytes, and the printer processes n bytes from the next
  character data as barcode data.
  •   If n is outside of the specified range, the printer stops command processing and starts
  processing incoming data as normal data.
  ```
- **Details:** •   If d is outside of the range, the printer only feeds paper and processes incoming data as  
  normal data.  
  - If the horizontal size exceeds printing area, the printer only feeds the paper.  
  - This command feeds as much paper as is required to print the bar code, regardless of the line  
  spacing specified by ESC 2 or ESC 3.  
  - This command is enabled only when no data exists in the print buffer. When data exists in the  
  print buffer, the printer processes the data following m as normal data.  
  - After printing barcode, this command sets the print position to the beginning of the line.  
  - This command is not affected by print modes (emphasized, double-strike, underline, character  
  size, white/black reverse printing, or 90° rotated character, etc.), except for upside-down  
  printing mode.
- **References:** GS H, GS f, GS h, GS w

#### `GS r n`

- **Function:** Transmit status.
- **Format:**

  ```
  ASCII  GS r n
  Hexadecimal  1D 72 n
  Decimal  29 114 n
  ```
- **Range:** n = 1, 2, 49, 50
- **Description:** Transmits the status specified by n as follows:

  ```
  n       Function
  1, 49   Transmit paper sensor status.
  ```
2, 50   Transmit drawer kick-out connector status.
- **Details:** •  When serial interface with DTR/DSR control is being used the printer transmits only 1 byte  
  after confirming the host is ready to receive data. If the host computer is not ready to receive  
  data, the printer waits until the host is ready. When serial interface with XON/XOFF control is  
  being used the printer transmits only 1 byte without confirming the condition of the DSR signal.  
  - This command is executed when commands bytes are processed in the receive buffer.  
  Therefore, there may be a time gap between receiving this command and transmitting the  
  status, depending on the receive buffer status.  
  - When Auto Status Back (ASB) is enabled using GS a, it is possible to differentiate status  
  transmitted by GS r and by ASB.  
  - The status types to be transmitted are shown below:  
  o  Paper sensor status (n = 1, 49)

  ```
  Bit    On/Off         Hex         Dec                        Function
  0, 1      Off          00          0       Paper roll near-end sensor status: OK.
  ```
On           03          3       Paper roll near-end sensor status: low paper.
2, 3      Off          00          0       Paper roll end sensor status: OK.
On           0C          12      Paper roll end sensor status: low paper.
4      Off          00          0       Not used. Fixed to off.
5, 6       -            -              -   Undefined
7      Off          00          0       Not used. Fixed to off.
Bits 2 and 3: When paper end sensor detects a paper end, the printer goes offline and does not
execute this command. Therefore, bits 2 and 3 do not transmit the status of paper end.
o  Drawer kick-out connector status (n = 2, 50)

  ```
  Bit     On/Off         Hex    Dec                          Function
  0         Off         00       0        Drawer kick-out connector pin 3 is LOW.
  ```
On          01       1        Drawer kick-out connector pin 3 is HIGH.
1-3          -           -       -        Undefined.
4         Off         00       0        Not used. Fixed to off.
5, 6        -           -       -        Undefined
7         Off         00       0        Not used. Fixed to off.
- **References:** DLE EOT, GS a

#### `GS v 0 m xL xH yL yH d1 ... dk`

- **Function:** Print raster bit image.
- **Format:**

  ```
  ASCII  GS v 0 m xL xH yL yH d1 ... dk
  Hexadecimal  1D 76 30 m xL xH yL yH d1 ... dk
  Decimal  29 118 48 m xL xH yL yH d1 ... dk
  ```
- **Range:** 0 ≤ m ≤ 3, 48 ≤ m ≤ 51  
  0 ≤ xL ≤ 255; 0 ≤ xH ≤ 255  
  0 ≤ yL ≤ 255; 0 ≤ yH ≤ 8  
  0 ≤ d ≤ 255  
  k = [(xL + xH × 256) × (yL + yH × 256)]    (k ≠ 0)
- **Description:** Select raster bit-image mode (m),  as follows:

  ```
  m         Mode          Vertical Dot Density            Horizontal Dot Density
  0, 48   Normal                  203 dpi                             203 dpi
  ```
1, 49   Double-width            203 dpi                             101 dpi
2, 50   Double-height           101 dpi                             203 dpi
3, 51   Quadruple               101 dpi                             101 dpi

  ```
  •  xL, xH, select the number of data bytes (xL+xH×256) in the horizontal direction for the bit
  image.
  •  yL, yH, select the number of data bytes (yL+yH×256) in the vertical direction for the bit image.
  ```
- **Details:** •  This command is effective only when there is no data in the print buffer.  
  - This command has no effect in all print modes (character size, emphasized, double-strike,  
  upside-down, underline, white/black reverse printing, etc.) for raster bit image.  
  - If the printing area width set by GS L and GS W is less than the minimum width, the printing  
  area is extended to the minimum width only on the line in question. The minimum width means  
  1 dot in normal (m=0, 48) and double-height (m=2, 50) modes, 2 dots in double-width (m=1,  
  49) and quadruple (m=3, 51) modes.  
  - Data outside printing area is read and discarded on a dot-by-dot basis.  
  - The position at which subsequent characters are to be printed for raster bit image is specified  
  by HT (Horizontal Tab), ESC $ (Set absolute print position), ESC \ (Set relative print position),  
  and GS L (Set left margin). If the position at which subsequent characters are to be printed is  
  not a multiple of 8, print speed may decrease.  
  - The ESC a (Select justification) setting is also effective on raster bit images.  
  - When this command is received during macro definition, the printer ends macro definition,  
  and begins performing this command. The definition of this command should be cleared.  
  - d indicates bit-image data. Setting a bit prints a dot and resetting a bit does not print a dot.

#### `GS w n`

- **Function:** Set barcode width.
- **Format:**

  ```
  ASCII  GS w n
  Hexadecimal  1D 77 n
  Decimal  29 119 n
  ```
- **Range:** 2≤n≤6
- **Default:** n=3
- **Description:** Set barcode horizontal size. n specifies barcode width as follows:

  ```
  n         Module width                    Binary-level Barcode
  (mm) for Multi-
  Thin element         Thick element
  level Barcode
  width (mm)           width (mm)
  2             0.250                   0.250                  0.625
  ```
3             0.375                   0.375                  1.000
4             0.500                   0.500                  1.250
5             0.625                   0.625                  1.625
6             0.750                   0.750                  2.000
Multi-level bar codes are as follows: UPC-A, UPC-E, EAN13, EAN8, CODE93, CODE128
Binary-level bar codes are as follows: CODE39, ITF, CODABAR
- **Reference:** GS k

#### `GS F9h 5 n`

- **Function:** Select printer operating mode.
- **Format:**

  ```
  ASCII  GS F9h 5 n
  Hexadecimal  1D F9 35 n
  Decimal  29 249 53 n
  ```
- **Range:** n = 0; n = 1; n = 48; n = 49;
- **Default:** n=0
- **Description:** If n is 0 (00h or 30h), ESC/Bema is selected.  
  If n is 1 (01h or 31h), ESC/POS is selected.
- **Notes:** This command modifies printer flags and save the new values to printer configuration memory.

#### `GS F9h 7 n`

- **Function:** Set and save printer default code page for ESC/Bema command set.
- **Format:**

  ```
  ASCII  GS F9h 7 n
  Hexadecimal  1D F9 37 n
  Decimal  29 249 55 n
  ```
- **Range:** 2 ≤ n ≤ 12; n = 14; n = 21
- **Default:** n=2
- **Description:** This command selects the code page to be used, according to the following options.
If n is 2 (02h or 32h), CODEPAGE 850 is selected.
If n is 3 (03h or 33h), CODEPAGE 437 is selected.
If n is 4 (04h or 34h), CODEPAGE 860 is selected.
If n is 5 (05h or 35h), CODEPAGE 858 is selected.
If n is 6 (06h or 36h), CODEPAGE 866 is selected.
If n is 7 (07h or 37h), CODEPAGE 864 is selected.
If n is 8 (08h or 38h), UTF8 (Unicode) is selected.
If n is 9 (09h or 39h), Big-5E is selected.
If n is 10 (0Ah or 3Ah), JIS is selected.
If n is 11 (0Bh or 3Bh), SHIFT JIS is selected.
If n is 12 (0Ch or 3Ch), GB2312 is selected.
If n is 14 (0Eh or 3Eh), EUC-CN is selected.
If n is 21 (15h or 45h), CODEPAGE 862 is selected.

#### `GS F9h 8 n`

- **Function:** Set and save ESC/POS ideogram mode.
- **Format:**

  ```
  ASCII  GS F9h 8 n
  Hexadecimal  1D F9 38 n
  Decimal  29 249 56 n
  ```
- **Visibility:** Public
- **Range:** 0≤n≤3
- **Default:** n=0
- **Description:** If n is 0 (00h or 30h), UTF8 (Unicode) ideogram mode is selected.  
  If n is 1 (01h or 31h), ESC/POS Japanese ideogram mode is selected.  
  If n is 2 (02h or 32h), ESC/POS Simplified Chinese ideogram mode selected.  
  If n is 3 (03h or 33h), ESC/POS Traditional Chinese ideogram mode is selected.

#### `GS F9h C 00h`

- **Function:** Get printer current command set.
- **Format:**

  ```
  ASCII  GS F9h C 00h
  Hexadecimal  1D F9 43 00
  Decimal  29 249 67 0
  ```
- **Description:** Return one byte with current command set. If returned byte is 0 (00h), printer is operating in  
  ESC/Bema mode. If returned byte is 1 (01h), printer is operating in ESC/POS mode.

#### `GS F9h SP n`

- **Function:** Select printer operating mode of operation temporarily.
- **Format:**

  ```
  ASCII  GS F9h SP n
  Hexadecimal  1D F9 20 n
  Decimal  29 249 32 n
  ```
- **Range:** n = 0; n = 1; n = 48; n = 49;
- **Description:** If n is 0 (00h or 30h), ESC/Bema is selected.  
  If n is 1 (01h or 31h), ESC/POS is selected.
- **Notes:** This command modifies printer flags but does not save the new values to the printer configuration  
  memory. The new mode starts as the printer has been just initialized (ESC @ has been  
  executed).

#### `GS F9h 1Fh 1`

- **Function:** Return to previously set mode of operation.
- **Format:**

  ```
  ASCII  GS F9h 1Fh 1
  Hexadecimal  1D F9 1F 31
  Decimal  29 249 31 49
  ```
- **Description:** Configuration command used to put printer mode back to that used before issuing GS F9h SP n  
  command. The previous mode re-starts as the printer has been just initialized (ESC @ has been  
  executed).

#### `GS F9h - n`

- **Function:** Set and save printer mode.
- **Format:**

  ```
  ASCII  GS F9h – n
  Hexadecimal  1D F9 2D n
  Decimal  29 249 45 n
  ```
- **Default:** n=0
- **Description:** Set printer priority to high quality of high speed.  
  n = 0 or 30h – normal.  
  n = 1 or 31h – high quality.  
  n = 2 or 32h – high speed.

#### `GS F9h ! n`

- **Function:** Set and save paper width.
- **Format:**

  ```
  ASCII  GS F9h ! n
  Hexadecimal  1D F9 21 n
  Decimal  29 249 33 n
  ```
- **Description:** Set paper width as described in the table below:

  ```
  n         Paper width (mm)              Printing width (mm)
  00h                 58                              48
  ```
01h                 76                              72
02h                 80                              72
03h                 80                              76
04h                82.5                             72
05h                82.5                             76
06h                82.5                             80
- **Notes:** This command has effect only when printer is in ESC/Bema operating mode. For ESC/POS mode  
  paper width is always set to 80mm/73.5mm.

#### `GS F9h , n`

- **Function:** Enable/disable paper near-end sensor.
- **Format:**

  ```
  ASCII  GS F9h , n
  Hexadecimal  1D F9 2C n
  Decimal  29 249 44 n
  ```
- **Default:** n=1
- **Description:** Enable or disable paper near-end sensor (PNES). This setting is saved to configuration (non-  
  volatile) memory.  
  n = 1 or 31h – enable PNES.  
  n = 0 or 30h – disable PNES.

#### `GS F9h + n`

- **Function:** Set and save printing intensity.
- **Format:**

  ```
  ASCII  GS F9h + n
  Hexadecimal  1D F9 2B n
  Decimal  29 249 43 n
  ```
- **Description:** Obsolete. Kept here to maintain compatibility with earlier Bematech products.

#### `GS FAh n`

- **Function:** Set and save printer language.
- **Format:**

  ```
  ASCII  GS FAh n
  Hexadecimal  1D FA n
  Decimal  29 250 n
  ```
- **Description:** Set printer language.  
  n = 0 or 30h – English  
  n = 1 or 31h – Portuguese  
  n = 2 or 32h – Spanish  
  n = 3 or 33h – German  
  n = 4 or 34h – Italian  
  n = 5 or 35h – French  
  n = 6 or 36h – Simplified Chinese  
  n = 7 or 37h – Traditional Chinese  
  n = 8 or 38h – Japanese

#### `GS F9h ‘ n`

- **Function:** Get printer information.
- **Format:**

  ```
  ASCII  GS F9h ‘ n
  Hexadecimal  1D F9 27 n
  Decimal  29 249 39 n
  ```
- **Description:** Retrieve printer information according to values described in the following table:  
  n        Information                                    Data type      Return size  
  0, 30h   Product code (“MP-4200 TH”)                    ASCII string   10 bytes
1, 31h   Serial number                                  ASCII string   20 bytes
2, 32h   Manufacturing date                             ASCII string   4 bytes
3, 33h   Firmware version                               ASCII string   3 bytes
4, 34h   Reserved
Manufacturing timestamp
5, 35h                                                  ASCII string   17 bytes
(“dd/mm/yy hh:mm:ss” format)
6, 36h   Reserved
7, 37h   Reserved
Interface type (0 = None; 1 = Serial DB-9; 2
8, 38h                                                  Integer        1 byte
= Serial DB-25; 3 = Ethernet, -1 = Unknown)

#### `GS F9h ( 0`

- **Function:** Load default user configuration.
- **Format:**

  ```
  ASCII  GS F9h ( 0
  Hexadecimal  1D F9 28 30
  Decimal  29 249 40 48
  ```
- **Description:** Reload all configurations from non-volatile memory and dipswitches.

#### `GS F9h ) 0`

- **Function:** Print user configuration.
- **Format:**

  ```
  ASCII  GS F9h ) 0
  Hexadecimal  1D F9 29 30
  Decimal  29 249 41 48
  ```
- **Description:** Print on paper the current user configuration.

#### `GS F8h 1`

- **Function:** Printer extended status enquiry.
- **Format:**

  ```
  ASCII  GS F8h 1
  Hexadecimal  1D F8 31
  Decimal  29 248 49
  ```
- **Description:** Issuing this command makes the printer to return five status bytes.
The first byte is the printer status:
7        6–5             4          3            2         1          0
1       BufStat      Wait        Offline        OVR        0          0
Bit 2: OVR (Overrun Error)
0 – Printer is ready to receive data.
1 – Printer is in overrun condition. If more data is
received, it will be lost.
Bit 3: Offline.
0 – Printer is on-line.
1 – Printer is off-line.
Bit 4: Wait.
0 – Printer is printing (busy condition).
1 – Printer buffer is empty, waiting for more data
or commands.
Bit 6 & 5: BufStat - Buffer status.
00 – Printer buffer empty.
01 – Printer buffer is under 1/3 of its capacity.
10 – Printer buffer is above 1/3 of its capacity.
11 – Printer buffer is beyond ¾ of its capacity.
The second byte is the off-line status:
7         6              5         4        3         2         1         0
Cover     Error      NoPaper       Drawer     0         PS       PNES       1
Bit 1: PNES – Paper Near-end Sensor
0 – Paper is not near the end of roll.
1 – Paper is near the end of roll.
Bit 2: PS – Paper sensor
0 – Printer has paper.
1 – Printer has no paper at all.
Bit 4: Drawer
0 – Drawer sensor is in low level (logical 0).
1 – Drawer sensor is in high level (logical 1).
Bit 5: NoPaper
0 – Printer has paper.
1 – Printer has no paper at all.
Bit 6: Error
0 – No error condition exist in the printer.
1 – At least one error condition is being reported by
the printer.
Bit 7: Cover
0 – Printer cover is opened.
1 – Printer cover is closed.
The third byte is printer error status:
7        6            5         4         3               2   1   0
1        RE         NRE         1        CE           CA      0   0
Bit 2: CA – Cutter Absence
0 – Cutter present.
1 – Cutter absent.
Bit 3: CE – Cutter Error
0 – No error condition detected in the cutter.
1 – Cutter error condition detected.
Bit 5: NRE – Non-recoverable Error
0 – NRE condition not detected.
1 – NRE condition detected.
Bit 6: RE – Recoverable Error
0 – RE condition not present.
1 – RE condition present.
The fourth byte is printer head and command set status:
7         6           5         4        3            2       1   0
1       CMD           0         1        0        HOH         0   1
Bit 2: HOH – Head Overheat
0 – Print head has normal temperature.
1 – Print head is overheated.
Bit 6: CMD – Current command set
0 – ESC/Bema command set
1 – ESC/POS command set
The fifth byte is firmware version and revision:
7             6–4                               3–0
0      Firmware version                   Firmware revision
- **Notes:** Valid only when ethernet or wi-fi interface is being used.

#### `GS F8h F`

- **Function:** Printer reset.
- **Format:**

  ```
  ASCII  GS F8h F
  Hexadecimal  1D F8 46
  Decimal  29 248 70
  ```
- **Description:** Force a hardware reset on the printer.

#### `GS F9h D m n`

- **Function:** Activate buzzer on cut.
- **Format:**

  ```
  ASCII  GS F9h D m n
  Hexadecimal  1D F9 44 m n
  Decimal  29 249 68 m n
  ```
- **Range:** m = 0, 1, 2  
  0 ≤ n ≤ 255
- **Default:** m = 0, n = 2
- **Description:** Set buzzer activation on paper cut.  
  If m = 0 no buzzer is activated  
  If m = 1 the internal buzzer is activated  
  If m = 2 the external buzzer is activated  
  The activation time is n x 100ms.

#### `GS F9h E n`

- **Function:** Set DHCP usage.
- **Format:**

  ```
  ASCII  GS F9h E n
  Hexadecimal  1D F9 45 n
  Decimal  29 249 69 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** If LSB of n is 1, the DHCP is enabled.

#### `GS F7h BS NUL “ i1 ...i4 s1 ...s 4`

- **Function:** Set IP address and subnet mask.
- **Format:**

  ```
  ASCII  GS F7h BS NUL “ i1...i4 s1...s 4
  Hexadecimal  1D F7 08 00 22 i1...i4 s 4...s 4
  Decimal  29 247 8 0 34 i1...i4 s 4...s 4
  ```
- **Description:** Program a fixed IP address and subnet mask to the printer.
- **Example:** To define an IP address of 10.10.1.2 and a subnet mask of 255.255.0.0, the following command  
  should be send:  
  1D F7 08 00 22 0A 0A 01 02 FF FF 00 00
- **Notes:** Valid only when Ethernet interface is being used.

#### `FS ! n`

- **Function:** Set print mode(s) for ideograms.
- **Format:**

  ```
  ASCII  FS ! n
  Hexadecimal  1C 21 n
  Decimal  28 33 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Set print mode for ideograms, using n as follows:

  ```
  Bit      On/Off            Hex           Dec       Function
  0, 1     -                 -             -         Undefined.
  ```

  ```
  Off               00            0         Double-width mode is OFF.
  On                04            4         Double-width mode is ON.
  ```

  ```
  Off               00            0         Double-height mode is OFF.
  On                08            8         Double-height mode is ON.
  ```
4–6      -                 -             -         Undefined.

  ```
  Off               00            0         Underline mode is OFF.
  On                80            128       Underline mode is ON.
  ```
- **Notes:** •   When both double-width and double-height modes are set (including right- and left-side  
  character spacing), quadruple-size characters are printed.  
  - The printer can underline all characters (including right- and left-side character spacing), but  
  cannot underline the space set by HT and 90° clockwise-rotated characters.  
  - The thickness of the underline is that specified by FS −, regardless of the character size.  
  - When some of the characters in a line are double or more height, all characters are baseline  
  aligned.  
  - It is possible to emphasize the ideogram using FS W or GS !, the setting of the last received  
  command is effective.  
  - It is possible to turn underline mode on or off using FS −, and the setting of the last received  
  command is effective.
- **References:** FS -, FS W, GS !

#### `FS &`

- **Function:** Select ideogram mode.
- **Format:**

  ```
  ASCII  FS &
  Hexadecimal  1C 26
  Decimal  28 38
  ```
- **Description:** Switch from codepage to ideogram mode.
- **Notes:** •  When ideogram code system is SHIFT JIS, the printer performs only internal flag operations.  
  Printing is not affected.  
  Behavior when in Japanese mode (JIS and SHIFT JIS):  
  - This command is effective only when the JIS code system is selected.  
  - When ideogram mode is selected, the printer processes all ideogram codes for each two bytes.  
  - Ideogram codes are processed in the order of the first byte and second byte.  
  - Ideogram mode is not selected when the power is turned on.  
  - Using FS C, the ideogram code system is selected.  
  Behavior when in Chinese mode (EUC-CN and BIG-5E):  
  - When ideogram mode is selected, the printer checks whether the code is for ideograms or not,  
  then processed the first byte and the second byte if the code is for ideograms.  
  - Ideogram codes are processed in the order of the first byte and second byte.  
  - Ideogram mode is selected when the power is turned on.
- **References:** FS ., FS C

#### `FS - n`

- **Function:** Turn underline mode on/off for ideograms.
- **Format:**

  ```
  ASCII  FS - n
  Hexadecimal  1C 2D n
  Decimal  28 45 n
  ```
- **Range:** 0 ≤ n ≤ 2, 48 ≤ n ≤ 50
- **Default:** n=0
- **Description:** Turn underline mode for ideograms on or off, based on the following values of n:

  ```
  n         Function
  0, 48     Turn off underline mode for ideograms.
  ```
1, 49     Turn on underline mode for ideograms (1-dot thick).
2, 50     Turn on underline mode for ideograms (2-dot thick).
- **Notes:** •  The printer can underline all characters (including right- and left-side character spacing), but  
  cannot underline the space set by HT and 90° clockwise-rotated characters.  
  - After underline mode for ideograms is turned off by setting n to 0, underline printing is no  
  longer performed, but the previously specified underline thickness is not changed. The default  
  underline thickness is 1 dot.  
  - The specified line thickness does not change even when the character size changes.  
  - It is possible to turn underline mode on or off using FS !, and the last received command is  
  effective.
- **Reference:** FS !

#### `FS .`

- **Function:** Cancel ideogram mode.
- **Format:**

  ```
  ASCII  FS .
  Hexadecimal  1C 2E
  Decimal  28 46
  ```
- **Description:** Cancel ideogram mode.
- **Notes:** Behavior in Japanese models (JIS and SHIFT JIS):  
  - This command is effective only when the JIS code system is selected.  
  - When the ideogram mode is not selected, all character codes are processed one byte at a time  
  as ASCII code.  
  - Ideogram mode is not selected when the power is turned on.  
  Behavior in Chinese models (EUC-CN and BIG-5E):  
  - When the ideogram mode is not selected, all character codes are processed one byte at a time  
  as ASCII codes.  
  - Ideogram mode is selected when the power is turned on.
- **References:** FS &, FS C

#### `FS C n`

- **Function:** Select ideogram code system.
- **Format:**

  ```
  ASCII  FS C n
  Hexadecimal  1C 43 n
  Decimal  28 67 n
  ```
- **Range:** 0 ≤ n ≤ 2, 48 ≤ n ≤ 50
- **Default:** n=0
- **Description:** Selects the ideogram code system, based on the following values of n:

  ```
  n       Ideogram Code System
  0, 48   JIS code
  ```
1, 49   SHIFT JIS code
- **Notes:** •  This command is effective only for Japanese model.  
  - In the JIS code system, the following codes are available:  
  o  Primary byte: 21h to 7Eh  
  o  Secondary byte: 21h to 7Eh  
  - In the SHIFT JIS code system, the following codes are available:  
  o  Primary byte: 81h to 9Fh and E0h to EFh.  
  o  Secondary byte: 40h to 7Eh and 80h to FCh.

#### `FS S n1 n2`

- **Function:** Set left- and right-side ideogram spacing.
- **Format:**

  ```
  ASCII  FS S n1 n2
  Hexadecimal  1C 53 n1 n2
  Decimal  28 83 n1 n2
  ```
- **Range:** 0 ≤ n1 ≤ 255  
  0 ≤ n2 ≤ 255
- **Default:** n1 = 0, n2 = 0
- **Description:** Set left- and right-side ideogram spacing using n1 and n2, respectively.  
  - When the printer model used supports GS P, the left-side character spacing is [n1 × horizontal  
  motion unit], and the right-side character spacing is [n2 × horizontal motion unit].
- **Notes:** •  When double-width mode is set, the left- and right-side character spacing is twice the normal value.  
  - Horizontal motion unit can be set by GS P. The previously specified character spacing does not  
  change, even if horizontal motion unit is changed by GS P.  
  - The value cannot be less than the minimum horizontal movement amount, and must be set in  
  even units of the minimum horizontal movement amount.
- **Reference:** GS P

#### `FS W n`

- **Function:** Turn quadruple-size mode on/off for ideograms.
- **Format:**

  ```
  ASCII  FS W n
  Hexadecimal  1C 57 n
  Decimal  28 87 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** Turn quadruple-size mode on or off for ideograms.  
  - When the LSB of n is 0, quadruple-size mode for ideograms is turned off.  
  - When the LSB of n is 1, quadruple-size mode for ideograms is turned on.
- **Notes:** •  Only the least significant bit of n is used.  
  - In quadruple-size mode, the printer prints the same size characters as when double-width and  
  double-height modes are both turned on.  
  - When quadruple-size mode is turned off using this command, the next characters are printed  
  in normal size.  
  - If some of the characters on a single line are different in height, they’re baseline aligned.  
  - FS ! and GS ! can be used to select and cancel quadruple-size mode, selecting double-height  
  and double-width modes.
- **References:** FS !, GS !

#### `GS F7h EOT NUL ‘ g1 …g4`

- **Function:** Set default gateway IP address
- **Format:**

  ```
  ASCII  GS F7h EOT NUL ‘ g1…g4
  Hexadecimal  1D F7 04 00 27 g1…g4
  Decimal  29 247 4 0 39 g1…g4
  ```
- **Default:** 0.0.0.0
- **Description:** This command sets the default gateway IP address, where g1..g4 are the IP address octets.
- **Notes:** Valid only when ethernet or wi-fi interface is being used.
- **Example:** If you want to set the gateway address to 192.168.1.2 the command must be sent as 1D F7 04  
  00 27 C0 A8 01 02

#### `GS F9h D m n`

- **Function:** Activate buzzer on cut
- **Format:**

  ```
  ASCII  GS F9h D m n
  Hexadecimal  1D F9 44 m n
  Decimal  29 249 68 m n
  ```
- **Range:** 0≤m≤2  
  0 ≤ n ≤ 255
- **Default:** m=0  
  n = 200
- **Description:** • This command tells the printer to active the buzzer at the same time of a cut is being performed.  
  - The buzzer to be activated is defined by m as follow:  
  m       buzzer  
  0       none (deactivate previous settings)  
  1       internal  
  2       external
- (n × 100ms) defines the activation time

#### `GS F9h E n`

- **Function:** Set DHCP usage.
- **Format:**

  ```
  ASCII  GS F9h E n
  Hexadecimal  1D F9 45 n
  Decimal  29 249 69 n
  ```
- **Range:** 0 ≤ n ≤ 255
- **Default:** n=0
- **Description:** If LSB of n is 1, the DHCP is enabled.

#### `GS F9h S m ip1 ..ip 4 n c1 ..cn`

- **Function:** Set SNMP settings
- **Format:**

  ```
  ASCII  GS F9h S m ip1..ip4 n c1..cn
  Hexadecimal  1D F9 53 m ip1..ip4 n c1..cn
  Decimal  29 249 83 m ip1..ip4 n c1..cn
  ```
- **Range:** 0 ≤ n ≤ 64
- **Default:** m=0  
  n=0
- **Description:** This command sets SNMP trap parameters.  
  - When m = 0, SNMP traps are disabled.  
  - When m ≠ 0, SNMP traps are enabled.  
  - n defines the SNMP community and is limited to 64 bytes.  
  - c1..cn define the community name.
- **Notes:** Valid only when ethernet or wi-fi interface is being used.

#### `GS F9h W a s c m n e1 ..em p1 ..pn`

- **Function:** Set Wi-Fi settings
- **Format:**

  ```
  ASCII  GS F9h W a s c m n e1..em p1..pn
  Hexadecimal  1D F9 57 a s c m n e1..em p1..pn
  Decimal  29 249 87 a s c m n e1..em p1..pn
  ```
- **Range:** a = 0, 1  
  s = 0, 1, 2, 3, 4  
  0 ≤ c ≤ 13  
  0 ≤ m ≤ 32  
  0 ≤ n ≤ 63
- **Default:** a=0  
  s=0  
  c=0  
  m=0  
  n=0
- **Description:** This command sets Wi-Fi communication settings.  
  - a defines the access mode as follow:

  ```
  a         Access mode
  0         Access Point
  1         Ad-hoc
  ```
- s defines the security mode as follow:

  ```
  s         Security mode
  0         No security
  1         WEP 64-bit
  2         WEP 128-bit
  3         WPA-TKIP personal
  4         WPA2-AES personal
  ```

  ```
  •  c defines the channel to use. Use c = 0 when a = 0.
  •  m defines the size of the ESSID.
  •  n defines the size of the passphrase.
  •  e1..em define the ESSID.
  •  p1..pn define the passphrase.
  ```
- **Notes:** Valid only when wi-fi interface is being used.

# Appendix I: Tables

Table 1 - Characters Per Line

58 mm

| Characters per line | Character per inch | Command (after ESC @) |
| --- | --- | --- |
| 32 | 17 | default |
| 42 | 22 | ESC SI or SI |
| 16 | 8 | ESC W 1 |
| 21 | 11 | ESC SI or SI plus ESC W 1 |

76 or 80 mm

| Characters per line | Character per inch | Command (after ESC @) |
| --- | --- | --- |
| 48 | 17 | default |
| 64 | 22 | ESC SI or SI |
| 24 | 8 | ESC W 1 |
| 32 | 11 | ESC SI or SI plus ESC W 1 |

# Appendix II: Character Tables

### ASCII

The codes from 00h up to 7Fh are shown below:

### Code Page 437

### Code Page 850

Code Page 850 character set is from 00h up to 7Fh and is the same characters as the ASCII table. Characters
between 80h and FFh are available for use for international languages.

### Code Page 858

### Code Page 860

### Code Page 866

Code Page 866 character set is from 00h up to 7Fh and is the same characters as the ASCII table. Characters
between 80h and FFh are available for use for cyrillic languages (Russian, Bulgarian, Serbian, etc.).

```
       -0     -1     -2     -3     -4     -5     -6     -7      -8    -9     -A     -B     -C     -D     -E     -F

 0-           ☺      ☻       ♥      ♦      ♣      ♠      •      ◘      ○      ◙      ♂      ♀      ♪      ♫     ☼
              263A   263B   2665   2666   2663   2660   2022   25D8   25CB   25D9   2642   2640   266A   266B   263C

 1-    ►      ◄      ↕       ‼      ¶      §     ▬       ↨      ↑      ↓     →      ←      ∟      ↔      ▲      ▼
      25BA    25C4   2195   203C   00B6   00A7   25AC   21A8   2191   2193   2192   2190   211F   2194   25B2   25BC

 2-            !      “     #       $     %      &       ‘      (      )      *     +       ,      -      .      /
       0020   0021   0022   0023   0024   0025   0026   0027   0028   0029   002A   002B   002C   002D   002E   0021

 3-    0       1     2      3       4      5      6      7      8      9      :      ;      <      =      >      ?
       0030   0031   0032   0033   0034   0035   0036   0037   0038   0039   003A   003B   003C   003D   003E   003F

 4-    @      A      B      C      D      E       F     G       H      I      J     K       L     M      N      O
       0040   0041   0042   0043   0044   0045   0046   0047   0048   0049   004A   004B   004C   004D   004E   004F

 5-    P      Q      R      S       T     U      V      W       X     Y      Z       [      \      ]      ^      _
       0050   0051   0052   0053   0054   0055   0056   0057   0058   0059   005A   005B   005C   005D   005E   005F

 6-     `      a     b       c      d      e      f      g      h      l      j      k      l     m       n      o
       0060   0061   0062   0063   0064   0065   0066   0067   0068   006C   006A   006B   006C   006D   006E   006F

 7-    p       q      r      s      t      u      v     w       x      y      z      {      |      }      ~      ⌂
       0070   0071   0072   0073   0074   0075   0076   0077   0078   0079   007A   007B   007C   007D   007E   2302

 8-    А      Б      В       Г     Д      Е      Ж      З       И     Й      К      Л      М      Н      О      П
       0410   0411   0412   0413   0414   0415   0416   0417   0418   0419   041A   041B   041C   041D   041E   041F

 9-    Р      С      Т      У      Ф      Х      Ц      Ч       Ш     Щ      Ъ      Ы      Ь      Э      Ю      Я
       0420   0421   0422   0423   0424   0425   0426   0427   0428   0429   042A   042B   042C   042D   042E   042F

 A-    а       б     в       г      д      е     җ       з      и      й      к     л      м       н      о      п
       0430   0431   0432   0433   0434   0435   0438   0437   0438   0439   043A   043B   043C   043D   043E   043F

 B-    ░      ▒      ▓      │      ┤      ╡      ╢      ╖       ╕     ╣      ║      ╗      ╝      ╜      ╛      ┐
       2591   2592   2593   2502   2524   2581   2582   2568   2555   2563   2551   2557   255D   255C   255B   2510

 C-    └      ┴      ┬      ├      ─      ┼      ╞      ╟       ╚     ╔      ╩      ╦      ╠      ═      ╬      ╧
       2514   2534   252C   251C   2500   253C   255E   255F   255A   2554   2569   2566   2560   2550   256C   2567

 D-    ╨      ╤      ╥      ╙      ╘      ╒      ╓      ╫       ╪     ┘      ┌      █      ▄       ▌     ▐      ▀
       2568   2564   2565   2559   2558   2552   2553   256B   256A   2516   250C   2588   2584   258C   2590   2580

 E-    р       с      т      у     ф       х      ц      ч      ш     щ      ъ      ы       ь      э     ю       я
       0440   0441   0442   0443   0444   0445   0446   0447   0448   0449   044A   044B   044C   044D   044E   044F

 F-    Ё       ё     Є       є      Ї      ї      Ў      ў      °      ∙      ·      √     №       ¤     ■
       0401   0451   0404   0454   0407   0457   040E   045E   00B0   2219   00B7   221A   2116   00A4   25A0   00A0
```

# Appendix III: Transmission Status Identification

Because the specified status bits transmitted from the ESC/POS commands are fixed, the user can confirm
the command to which the status belongs, as shown in the following table.
When using Auto Status Back (ASB), however, process the consecutive three-byte code (except for XOFF) as
ASB data after confirming the first byte of the ASB. Otherwise, the status transmitted by using the GS r and the
status of the second and following bytes of the ASB cannot be differentiated.

## Transmission Status Identification

| Command & Function | Status Reply |
| --- | --- |
| GS I | `<0**0****>B` |
| GS r | `<0**0****>B` |
| XON | `<00010001>B` |
| XOFF | `<00010011>B` |
| DLE EOT | `<0**1**10>B` |
| ASB (1st byte) | `<0**1**00>B` |
| ASB (2nd to 4th bytes) | `<0**0****>B` |
