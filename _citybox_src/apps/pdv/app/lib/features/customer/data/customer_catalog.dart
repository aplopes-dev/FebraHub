import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';
import 'package:citybox_pdv/features/customer/domain/customer_gender.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';

/// Categorias comerciais da loja — **fixture só para testes**.
///
/// Produção: `GET /v1/pos/customer-categories` via
/// [customerCatalogProvider].
const List<CustomerCategory> customerCategories = <CustomerCategory>[
  CustomerCategory(id: 'cat_padrao', name: 'Padrão'),
  CustomerCategory(id: 'cat_vip', name: 'VIP'),
  CustomerCategory(id: 'cat_atacado', name: 'Atacado'),
];

/// Clientes cadastrados — **fixture só para testes**.
///
/// Produção: `GET /v1/pos/customers` via [customerCatalogProvider]. Nunca
/// semeia a UI real (mesmo padrão do catálogo de produtos).
const List<Customer> seedCustomers = <Customer>[
  Customer(
    id: 'cust_01',
    name: 'Maria Aparecida Santos',
    personType: CustomerPersonType.individual,
    document: '52998224725',
    rg: '1234567',
    birthDate: '1988-03-14',
    email: 'maria.santos@email.com',
    gender: CustomerGender.female,
    phone: '7332310000',
    mobilePhone: '73999887766',
    address: CustomerAddress(
      zipCode: '45650970',
      street: 'Rua Jorge Amado',
      number: '120',
      district: 'Centro',
      state: 'BA',
      city: 'Ilhéus',
    ),
    categoryId: 'cat_padrao',
  ),
  Customer(
    id: 'cust_02',
    name: 'José Carlos Oliveira',
    personType: CustomerPersonType.individual,
    document: '39053344705',
    birthDate: '1975-11-02',
    email: 'jose.oliveira@email.com',
    gender: CustomerGender.male,
    mobilePhone: '73988776655',
    address: CustomerAddress(
      zipCode: '45653200',
      street: 'Avenida Soares Lopes',
      number: '45',
      complement: 'Apto 302',
      district: 'Pontal',
      state: 'BA',
      city: 'Ilhéus',
    ),
    categoryId: 'cat_vip',
    notes: 'Prefere nota sem CPF no cupom.',
  ),
  Customer(
    id: 'cust_03',
    name: 'Comércio de Bebidas Atlântico LTDA',
    personType: CustomerPersonType.company,
    document: '12345678000195',
    email: 'contato@atlantico.com.br',
    phone: '7332123456',
    mobilePhone: '73991234567',
    address: CustomerAddress(
      zipCode: '45655000',
      street: 'Rodovia Ilhéus–Itabuna',
      number: 'KM 2',
      district: 'Salobrinho',
      state: 'BA',
      city: 'Ilhéus',
    ),
    categoryId: 'cat_atacado',
  ),
  Customer(
    id: 'cust_04',
    name: 'Ana Beatriz Ferreira',
    personType: CustomerPersonType.individual,
    document: '15350946056',
    gender: CustomerGender.female,
    mobilePhone: '73987654321',
    categoryId: 'cat_padrao',
  ),
  Customer(
    id: 'cust_05',
    name: 'Padaria Doce Maré ME',
    personType: CustomerPersonType.company,
    document: '98765432000110',
    phone: '7332345678',
    address: CustomerAddress(
      zipCode: '45650250',
      street: 'Rua Antônio Lavigne',
      number: '88',
      district: 'Centro',
      state: 'BA',
      city: 'Ilhéus',
    ),
    categoryId: 'cat_padrao',
  ),
  Customer(
    id: 'cust_06',
    name: 'Rafael Souza Lima',
    personType: CustomerPersonType.individual,
    document: '11144477735',
    birthDate: '1992-07-21',
    gender: CustomerGender.male,
    email: 'rafael.lima@email.com',
    mobilePhone: '73995551234',
    categoryId: 'cat_vip',
  ),
];
